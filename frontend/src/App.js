import { useEffect, useMemo, useState } from "react";
import "./App.css";

const TOKEN_KEY = "medispToken";

function App() {
  const [token, setToken] = useState(localStorage.getItem(TOKEN_KEY) || "");
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({ theme: "light", font_size: "medium" });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState({ first_name: "", last_name: "" });
  const [selectedFile, setSelectedFile] = useState(null);
  const [originalImageUrl, setOriginalImageUrl] = useState("");
  const [processedImageUrl, setProcessedImageUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const authHeaders = useMemo(() => {
    if (!token) {
      return {};
    }
    return { Authorization: `Token ${token}` };
  }, [token]);

  const applySessionData = (meData, profileData) => {
    setUser(meData);
    setProfile(profileData);
    setNameDraft({
      first_name: meData.first_name || "",
      last_name: meData.last_name || "",
    });
  };

  const fetchSessionData = async (activeToken) => {
    const headers = { Authorization: `Token ${activeToken}` };

    const [meResponse, profileResponse] = await Promise.all([
      fetch("/api/me/", { headers }),
      fetch("/api/profile/", { headers }),
    ]);

    if (!meResponse.ok || !profileResponse.ok) {
      throw new Error("Session is invalid. Please log in again.");
    }

    const meData = await meResponse.json();
    const profileData = await profileResponse.json();
    applySessionData(meData, profileData);
  };

  useEffect(() => {
    const bootstrapAuth = async () => {
      if (!token) {
        setUser(null);
        return;
      }

      setIsAuthLoading(true);
      setErrorMessage("");
      try {
        await fetchSessionData(token);
      } catch (error) {
        localStorage.removeItem(TOKEN_KEY);
        setToken("");
        setUser(null);
        setErrorMessage(error.message || "Failed to restore session.");
      } finally {
        setIsAuthLoading(false);
      }
    };

    bootstrapAuth();
  }, [token]);

  const handleCredentialChange = (event) => {
    const { name, value } = event.target;
    setCredentials((current) => ({ ...current, [name]: value }));
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setIsAuthLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Login failed.");
      }

      localStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
      setCredentials({ username: "", password: "" });
    } catch (error) {
      setErrorMessage(error.message || "Unable to login.");
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsAuthLoading(true);
    setErrorMessage("");
    try {
      if (token) {
        await fetch("/api/logout/", { method: "POST", headers: authHeaders });
      }
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      setToken("");
      setUser(null);
      setIsSettingsOpen(false);
      setSelectedFile(null);
      setOriginalImageUrl("");
      setProcessedImageUrl("");
      setIsAuthLoading(false);
    }
  };

  const handleSaveName = async () => {
    setIsSavingName(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/me/", {
        method: "PATCH",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          first_name: nameDraft.first_name,
          last_name: nameDraft.last_name,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Could not update your name.");
      }

      setUser(data);
      setIsEditingName(false);
    } catch (error) {
      setErrorMessage(error.message || "Could not update your name.");
    } finally {
      setIsSavingName(false);
    }
  };

  const updateProfilePreference = async (partialProfile) => {
    setIsSavingProfile(true);
    setErrorMessage("");

    const previousProfile = { ...profile };
    const nextProfile = { ...profile, ...partialProfile };
    setProfile(nextProfile);

    try {
      const response = await fetch("/api/profile/", {
        method: "PATCH",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(partialProfile),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Could not update profile settings.");
      }

      setProfile(data);
    } catch (error) {
      setProfile(previousProfile);
      setErrorMessage(error.message || "Could not update profile settings.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleThemeToggle = () => {
    const nextTheme = profile.theme === "dark" ? "light" : "dark";
    updateProfilePreference({ theme: nextTheme });
  };

  const handleFontSizeToggle = () => {
    const order = ["small", "medium", "large"];
    const currentIndex = order.indexOf(profile.font_size);
    const nextIndex = (currentIndex + 1) % order.length;
    updateProfilePreference({ font_size: order[nextIndex] });
  };

  const handleCloseSettings = () => {
    setIsSettingsOpen(false);
    setIsEditingName(false);
    setNameDraft({
      first_name: user?.first_name || "",
      last_name: user?.last_name || "",
    });
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      setOriginalImageUrl("");
      setProcessedImageUrl("");
      return;
    }

    setSelectedFile(file);
    setOriginalImageUrl(URL.createObjectURL(file));
    setProcessedImageUrl("");
    setErrorMessage("");
  };

  const handleProcessImage = async () => {
    if (!selectedFile) {
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    const formData = new FormData();
    formData.append("image", selectedFile);

    try {
      const response = await fetch("/api/process-image/", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Image processing failed.");
      }

      setProcessedImageUrl(`data:image/png;base64,${data.image}`);
    } catch (error) {
      setErrorMessage(error.message || "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  const displayName = [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim();
  const fontScale = profile.font_size === "small" ? "14px" : profile.font_size === "large" ? "18px" : "16px";

  if (!token) {
    return (
      <main className="login-page">
        <section className="login-card">
          <h1>Day 4 Login</h1>
          <p>Sign in to access your personalized image lab settings.</p>
          <form onSubmit={handleLogin} className="stack-form">
            <input
              type="text"
              name="username"
              value={credentials.username}
              onChange={handleCredentialChange}
              placeholder="Username"
              required
            />
            <input
              type="password"
              name="password"
              value={credentials.password}
              onChange={handleCredentialChange}
              placeholder="Password"
              required
            />
            <button type="submit" disabled={isAuthLoading}>
              {isAuthLoading ? "Signing in..." : "Login"}
            </button>
          </form>
          {errorMessage && <p className="error-text">{errorMessage}</p>}
        </section>
      </main>
    );
  }

  return (
    <main
      className={`app-shell ${profile.theme === "dark" ? "theme-dark" : "theme-light"}`}
      style={{ fontSize: fontScale }}
    >
      <div className="app-inner">
        <header className="topbar">
          <h1>Day 4 Image Processing Lab</h1>
          <div className="topbar-actions">
            <button
              type="button"
              className="icon-btn"
              onClick={handleThemeToggle}
              disabled={isSavingProfile}
              title={`Theme: ${profile.theme}`}
            >
              {profile.theme === "dark" ? "🌙" : "☀️"}
            </button>
            <button
              type="button"
              className="icon-btn"
              onClick={handleFontSizeToggle}
              disabled={isSavingProfile}
              title={`Font size: ${profile.font_size}`}
            >
              {profile.font_size === "small" ? "A" : profile.font_size === "medium" ? "Aa" : "AAA"}
            </button>
            <button type="button" onClick={() => setIsSettingsOpen(true)} disabled={isAuthLoading || !user}>
              User Settings
            </button>
            <button type="button" onClick={handleLogout} disabled={isAuthLoading}>Logout</button>
          </div>
        </header>

        {isAuthLoading && <p className="status-text">Loading your profile...</p>}
        {isSavingProfile && <p className="status-text">Saving preferences...</p>}
        <p className="lead-text">Upload an image and convert it to grayscale using the Django API.</p>

        <section className="upload-bar">
          <input type="file" accept="image/*" onChange={handleFileChange} />
          <button type="button" onClick={handleProcessImage} disabled={!selectedFile || isLoading}>
            {isLoading ? "Processing..." : "Process Image"}
          </button>
        </section>

        {errorMessage && <p className="error-text">{errorMessage}</p>}

        <section className="image-grid">
          <article className="image-card">
            <h2>Original Image</h2>
            {originalImageUrl ? (
              <img src={originalImageUrl} alt="Original upload" className="image-preview" />
            ) : (
              <p className="muted-text">Select an image to preview it here.</p>
            )}
          </article>

          <article className="image-card">
            <h2>Processed Image</h2>
            {processedImageUrl ? (
              <img src={processedImageUrl} alt="Processed grayscale output" className="image-preview" />
            ) : (
              <p className="muted-text">Processed image will appear here.</p>
            )}
          </article>
        </section>
      </div>

      {isSettingsOpen && user && (
        <div className="modal-overlay" onClick={handleCloseSettings}>
          <section className="settings-modal" onClick={(event) => event.stopPropagation()}>
            <h2>User Settings</h2>

            <h3>User Information</h3>
            <p className="muted-text">Username: {user.username}</p>
            <p className="muted-text">Email: {user.email || "(not set)"}</p>
            <p className="muted-text">Last login: {user.last_login || "No previous login recorded"}</p>

            <div className="name-block">
              {!isEditingName ? (
                <button type="button" className="name-display" onClick={() => setIsEditingName(true)}>
                  <span>{displayName || "Add first and last name"}</span>
                  <span className="name-display-icon" aria-hidden="true">✏️</span>
                </button>
              ) : (
                <div className="stack-form">
                  <label>
                    First name
                    <input
                      type="text"
                      name="first_name"
                      value={nameDraft.first_name}
                      onChange={(event) => setNameDraft((current) => ({ ...current, first_name: event.target.value }))}
                    />
                  </label>
                  <label>
                    Last name
                    <input
                      type="text"
                      name="last_name"
                      value={nameDraft.last_name}
                      onChange={(event) => setNameDraft((current) => ({ ...current, last_name: event.target.value }))}
                    />
                  </label>
                  <div className="actions-row">
                    <button type="button" onClick={() => setIsEditingName(false)} disabled={isSavingName}>Cancel</button>
                    <button type="button" onClick={handleSaveName} disabled={isSavingName}>
                      {isSavingName ? "Saving..." : "Save Name"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="actions-row">
              <button type="button" onClick={handleCloseSettings}>Close</button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

export default App;
