import React, { useState, useEffect } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const PLATFORM_CONFIG = {
  'GitHub': { icon: 'fa-brands fa-github', colorClass: 'github' },
  'LinkedIn': { icon: 'fa-brands fa-linkedin', colorClass: 'linkedin' },
  'Twitter': { icon: 'fa-brands fa-x-twitter', colorClass: 'twitter' },
  'Instagram': { icon: 'fa-brands fa-instagram', colorClass: 'instagram' },
  'Facebook': { icon: 'fa-brands fa-facebook', colorClass: 'facebook' },
  'WhatsApp': { icon: 'fa-brands fa-whatsapp', colorClass: 'whatsapp' },
  'TikTok': { icon: 'fa-brands fa-tiktok', colorClass: 'tiktok' },
  'YouTube': { icon: 'fa-brands fa-youtube', colorClass: 'youtube' },
};

const App = () => {
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isAddLinkOpen, setIsAddLinkOpen] = useState(false)
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [editingLink, setEditingLink] = useState(null)
  const [linkUrl, setLinkUrl] = useState('')
  const [profileForm, setProfileForm] = useState({ name: '', description: '', logo_url: '' })
  const [newLink, setNewLink] = useState({ title: '', url: '' })

  const [socialLinks, setSocialLinks] = useState([])
  const [profile, setProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('token'));

  const isAuthenticated = !!token;

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        setIsLoading(true)
        const path = window.location.pathname;
        const slug = path.split('/').filter(Boolean)[0] || 'mqinfo';
        const response = await fetch(`${API_BASE_URL}/profiles/public/${slug}`)
        if (!response.ok) throw new Error('Erreur lors de la récupération du profil')
        const data = await response.json()
        setProfile(data)
        const linksData = data.social_links || []
        const mappedLinks = linksData.map(link => ({
          id: link.id,
          name: link.title,
          url: link.url,
          ...PLATFORM_CONFIG[link.title] || { icon: 'fa-solid fa-link', colorClass: '' }
        }))
        setSocialLinks(mappedLinks)
      } catch (err) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }
    fetchLinks()
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setIsLoginOpen(false);
    setIsProfileOpen(false);
    setIsAddLinkOpen(false);
    setIsEditOpen(false);
    setEditingLink(null);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    try {
      const path = window.location.pathname;
      const slug = path.split('/').filter(Boolean)[0] || 'mqinfo';

      const response = await fetch(`${API_BASE_URL}/profiles/update/${slug}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileForm),
      })
      if (response.status === 401 || response.status === 403) {
        handleLogout();
        alert('Session expirée, veuillez vous reconnecter.');
        return;
      }
      if (!response.ok) throw new Error('Erreur lors de la mise à jour du profil')
      const updatedProfile = await response.json()
      setProfile(updatedProfile)
      setIsProfileOpen(false)
    } catch (err) {
      alert(err.message)
    }
  }

  const handleAddLink = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch(`${API_BASE_URL}/links`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newLink,
          profile_id: profile?.id
        }),
      })
      if (response.status === 401 || response.status === 403) {
        handleLogout();
        alert('Session expirée, veuillez vous reconnecter.');
        return;
      }
      if (!response.ok) throw new Error('Erreur lors de l\'ajout du lien')
      const addedLink = await response.json()
      const mappedLink = {
        id: addedLink.id,
        name: addedLink.title,
        url: addedLink.url,
        ...PLATFORM_CONFIG[addedLink.title] || { icon: 'fa-solid fa-link', colorClass: '' }
      }
      setSocialLinks(prev => [...prev, mappedLink])
      setIsAddLinkOpen(false)
      setNewLink({ title: '', url: '' })
    } catch (err) {
      alert(err.message)
    }
  }

  const handleUpdateLink = async (e) => {
    e.preventDefault()
    try {
      const linkId = editingLink.id;
      const response = await fetch(`${API_BASE_URL}/links/${linkId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ url: linkUrl }),
      })
      if (response.status === 401 || response.status === 403) {
        handleLogout();
        alert('Session expirée, veuillez vous reconnecter.');
        return;
      }
      if (!response.ok) throw new Error('Erreur lors de la mise à jour du lien')
      setSocialLinks(prev => prev.map(l => l.id === editingLink.id ? { ...l, url: linkUrl } : l))
      setIsEditOpen(false)
      setEditingLink(null)
    } catch (err) {
      alert(err.message)
    }
  }

  const handleDeleteLink = async (id) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce lien ?')) return;
    try {
      const response = await fetch(`${API_BASE_URL}/links/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        },
      })
      if (response.status === 401 || response.status === 403) {
        handleLogout();
        alert('Session expirée, veuillez vous reconnecter.');
        return;
      }
      if (!response.ok) throw new Error('Erreur lors de la suppression du lien')
      setSocialLinks(prev => prev.filter(l => l.id !== id))
    } catch (err) {
      alert(err.message)
    }
  }

  const openProfileEditor = () => {
    if (!isAuthenticated) {
      setIsLoginOpen(true);
      return;
    }
    setProfileForm({
      name: profile?.name || '',
      description: profile?.description || '',
      logo_url: profile?.logo_url || ''
    });
    setIsProfileOpen(true);
  };

  const openAddLinkModal = () => {
    if (!isAuthenticated) {
      setIsLoginOpen(true);
      return;
    }
    setIsAddLinkOpen(true);
  };

  const handleEditClick = (link) => {
    if (!isAuthenticated) {
      setIsLoginOpen(true);
      return;
    }
    setEditingLink(link);
    setLinkUrl(link.url);
    setIsEditOpen(true);
  };

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: "Inter", sans-serif;
          min-height: 100vh;
          background: linear-gradient(135deg, #00377f 0%, #0d6efd 55%, #00aee6 100%);
          display: flex; justify-content: center; align-items: center; padding: 30px 15px;
        }
        .container { width: 100%; max-width: 500px; text-align: center; }
        .profile { margin-bottom: 30px; }
        .profile-image { width: 100px; height: 100px; border-radius: 50%; object-fit: cover; border: 4px solid white; margin-bottom: 15px; }
        .profile h1 { color: white; font-size: 26px; margin-bottom: 8px; }
        .profile p { color: rgba(255,255,255,.85); font-size: 14px; }
        .links { display: flex; flex-direction: column; gap: 14px; }
        .link-wrapper { position: relative; }
        .link {
          display: flex; align-items: center; text-decoration: none; color: #172033; background: white;
          padding: 17px 20px; border-radius: 15px; font-weight: 600; transition: .25s ease; box-shadow: 0 8px 25px rgba(0,0,0,.12);
        }
        .link:hover { transform: translateY(-3px); box-shadow: 0 12px 30px rgba(0,0,0,.2); }
        .link i { width: 35px; font-size: 22px; }
        .link span { flex: 1; text-align: center; margin-right: 35px; }
        .edit-btn {
          position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
          background: rgba(0,0,0,0.05); border: none; border-radius: 50%; width: 30px; height: 30px;
          cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.2s; opacity: 0;
        }
        .delete-btn {
          position: absolute; right: 45px; top: 50%; transform: translateY(-50%);
          background: rgba(255,0,0,0.05); border: none; border-radius: 50%; width: 30px; height: 30px;
          cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.2s; opacity: 0;
          color: #dc3545;
        }
        .link-wrapper:hover .edit-btn, .link-wrapper:hover .delete-btn { opacity: 1; }
        .edit-btn:hover { background: rgba(0,0,0,0.15); }
        .delete-btn:hover { background: rgba(220,53,69,0.15); }
        .instagram i { color: #e1306c; } .facebook i { color: #1877f2; } .whatsapp i { color: #25d366; } .tiktok i { color: #111; } .youtube i { color: #ff0000; }
        .footer { margin-top: 25px; color: rgba(255,255,255,.7); font-size: 12px; }
        .admin {
          position: fixed; right: 20px; bottom: 20px; width: 45px; height: 45px; border-radius: 50%;
          background: rgba(255,255,255,.9); display: flex; align-items: center; justify-content: center;
          color: #00377f; cursor: pointer; text-decoration: none; box-shadow: 0 5px 20px rgba(0,0,0,.2); border: none;
        }
        .modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6);
          display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px);
        }
        .modal {
          background: white; padding: 30px; border-radius: 20px; width: 90%; max-width: 400px;
          position: relative; box-shadow: 0 20px 50px rgba(0,0,0,0.3); animation: modalSlideUp 0.3s ease-out;
        }
        @keyframes modalSlideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .modal h2 { margin-bottom: 20px; color: #333; text-align: center; }
        .modal-form { display: flex; flex-direction: column; gap: 15px; }
        .modal-form input { padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; }
        .modal-btn {
          padding: 12px; background: #0d6efd; color: white; border: none; border-radius: 8px;
          font-weight: 600; cursor: pointer; transition: background 0.2s;
        }
        .modal-btn:hover { background: #0a58ca; }
        .share-btn {
          margin: 20px auto;
          display: block;
          width: auto;
          padding: 10px 20px;
          border-radius: 20px;
          background: white;
          color: #00377f;
          border: none;
          font-weight: 600;
          cursor: pointer;
          transition: .25s ease;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        .share-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.15);
          background: #f8f9fa;
        }
        .qr-modal {
          text-align: center;
        }
        .qr-image {
          width: 200px;
          height: 200px;
          margin: 20px auto;
          border: 10px solid white;
          border-radius: 10px;
          box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        .close-modal { position: absolute; top: 15px; right: 15px; background: none; border: none; font-size: 20px; cursor: pointer; color: #999; }
      `}</style>

      <main className="container">
        {isLoading ? (
          <div style={{ color: 'white', fontSize: '20px' }}>Chargement...</div>
        ) : error ? (
          <div style={{ color: 'white', fontSize: '16px' }}>{error}</div>
        ) : (
          <>
            <section className="profile">
              <img className="profile-image" src={profile?.logo_url || "https://via.placeholder.com/200"} alt="Profile" />
              <h1>{profile?.name || "Chargement..."}</h1>
              <p>{profile?.description || "Chargement..."}</p>

              {!isAuthenticated && (
                <button className="share-btn" onClick={() => setIsShareOpen(true)}>
                  <i className="fa-solid fa-qrcode"></i> Partager le profil
                </button>
              )}

              {isAuthenticated && (
                <button
                  className="edit-btn"
                  style={{ position: 'static', opacity: 1, margin: '20px auto', display: 'block', width: 'auto', padding: '5px 15px', borderRadius: '20px', background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid white', cursor: 'pointer' }}
                  onClick={openProfileEditor}
                >
                  Modifier Profil
                </button>
              )}
            </section>

            <section className="links">
              {isAuthenticated && (
                <button
                  className="modal-btn"
                  style={{ marginBottom: '15px', width: '100%', background: 'white', color: '#0d6efd', border: '1px solid #0d6efd' }}
                  onClick={openAddLinkModal}
                >
                  + Ajouter un lien
                </button>
              )}
              {socialLinks.map((link) => (
                <div key={link.id} className="link-wrapper">
                  <a className={`link ${link.colorClass}`} href={link.url} target="_blank" rel="noopener noreferrer">
                    <i className={link.icon}></i>
                    <span>{link.name}</span>
                  </a>
                  {isAuthenticated && (
                    <>
                      <button className="delete-btn" onClick={() => handleDeleteLink(link.id)} title="Supprimer le lien">
                        <i className="fa-solid fa-trash-can" style={{fontSize: '14px'}}></i>
                      </button>
                      <button className="edit-btn" onClick={() => handleEditClick(link)} title="Modifier le lien">
                        <i className="fa-solid fa-pen-to-square" style={{fontSize: '14px'}}></i>
                      </button>
                    </>
                  )}
                </div>
              ))}
            </section>
          </>
        )}
      </main>

      <div className="footer">© 2026 MQAMTECH</div>

      <button
        className="admin"
        onClick={isAuthenticated ? handleLogout : () => setIsLoginOpen(true)}
        title={isAuthenticated ? "Déconnexion" : "Administration"}
      >
        <i className={isAuthenticated ? "fa-solid fa-right-from-bracket" : "fa-solid fa-lock"}></i>
      </button>

      {isShareOpen && (
        <div className="modal-overlay" onClick={() => setIsShareOpen(false)}>
          <div className="modal qr-modal" onClick={e => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setIsShareOpen(false)}>&times;</button>
            <h2>Partager mon profil</h2>
            <img
              className="qr-image"
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${window.location.href}`}
              alt="QR Code"
            />
            <p style={{ fontSize: '14px', color: '#666', margin: '15px 0' }}>
              Scannez le code QR pour accéder au profil
            </p>
            <button className="modal-btn" onClick={() => {
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              const img = new Image();
              img.crossOrigin = 'Anonymous';
              img.src = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${window.location.href}`;
              img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                const link = document.createElement('a');
                link.download = 'profile-qr.png';
                link.href = canvas.toDataURL('image/png');
                link.click();
              };
            }}>
              Télécharger le QR Code
            </button>
            <button className="modal-btn" style={{ background: '#6c757d', marginTop: '10px' }} onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              alert('Lien copié dans le presse-papier !');
            }}>
              Copier le lien
            </button>
          </div>
        </div>
      )}

      {isAuthenticated && isProfileOpen && (
        <div className="modal-overlay" onClick={() => setIsProfileOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setIsProfileOpen(false)}>&times;</button>
            <h2>Modifier Profil</h2>
            <form className="modal-form" onSubmit={handleUpdateProfile}>
              <input type="text" placeholder="Nom" value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} required />
              <input type="text" placeholder="Description" value={profileForm.description} onChange={e => setProfileForm({ ...profileForm, description: e.target.value })} required />
              <input type="url" placeholder="URL du Logo" value={profileForm.logo_url} onChange={e => setProfileForm({ ...profileForm, logo_url: e.target.value })} required />
              <button type="submit" className="modal-btn">Enregistrer</button>
            </form>
          </div>
        </div>
      )}

      {isAuthenticated && isAddLinkOpen && (
        <div className="modal-overlay" onClick={() => setIsAddLinkOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setIsAddLinkOpen(false)}>&times;</button>
            <h2>Ajouter un lien</h2>
            <form className="modal-form" onSubmit={handleAddLink}>
              <select value={newLink.title} onChange={e => setNewLink({ ...newLink, title: e.target.value })} required style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', background: 'white' }}>
                <option value="" disabled>Choisir une plateforme</option>
                {Object.keys(PLATFORM_CONFIG).map(platform => (
                  <option key={platform} value={platform}>{platform}</option>
                ))}
              </select>
              <input type="url" placeholder="URL" value={newLink.url} onChange={e => setNewLink({ ...newLink, url: e.target.value })} required />
              <button type="submit" className="modal-btn">Ajouter</button>
            </form>
          </div>
        </div>
      )}

      {!isAuthenticated && isLoginOpen && (
        <div className="modal-overlay" onClick={() => setIsLoginOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setIsLoginOpen(false)}>&times;</button>
            <h2>Connexion</h2>
            <form className="modal-form" onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const username = formData.get('username');
              const password = formData.get('password');
              try {
                const response = await fetch(`${API_BASE_URL}/login`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ username, password }),
                });
                if (!response.ok) throw new Error('Identifiants incorrects');
                const data = await response.json();
                if (!data.access_token) throw new Error('Token non reçu');
                localStorage.setItem('token', data.access_token);
                setToken(data.access_token);
                setIsLoginOpen(false);
              } catch (err) {
                alert(err.message);
              }
            }}>
              <input type="text" name="username" placeholder="Nom d'utilisateur" required />
              <input type="password" name="password" placeholder="Mot de passe" required />
              <button type="submit" className="modal-btn">Se connecter</button>
            </form>
          </div>
        </div>
      )}

      {isAuthenticated && isEditOpen && (
        <div className="modal-overlay" onClick={() => setIsEditOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setIsEditOpen(false)}>&times;</button>
            <h2>Modifier {editingLink?.name}</h2>
            <form className="modal-form" onSubmit={handleUpdateLink}>
              <input type="url" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://..." required />
              <button type="submit" className="modal-btn">Mettre à jour</button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export default App
