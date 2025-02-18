import React, { useState, useRef, useEffect, useCallback } from 'react';
import './App.css';

function App() {
  const [songs] = useState([
    {
      title: "First Song",
      artist: "Artist One",
      img_src: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop",
      src: "./sound/first.mp3"
    },
    {
      title: "Second Song",
      artist: "Artist Two",
      img_src: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=300&h=300&fit=crop",
      src: "./sound/second.mp3"
    },
    {
      title: "Third Song",
      artist: "Artist Three",
      img_src: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop",
      src: "./sound/third.mp3"
    },
    {
      title: "Fourth Song",
      artist: "Artist Four",
      img_src: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=300&h=300&fit=crop",
      src: "./sound/fourth.mp3"
    }
  ]);

  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [songDurations, setSongDurations] = useState({});
  const [shuffledIndices, setShuffledIndices] = useState([]);
  const [showMenu, setShowMenu] = useState(null);
  const audioRef = useRef(null);
  const [favorites, setFavorites] = useState([]);
  const [playlists, setPlaylists] = useState([
    { id: 1, name: "My Playlist #1", songs: [] },
    { id: 2, name: "My Playlist #2", songs: [] }
  ]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [showAddToPlaylistModal, setShowAddToPlaylistModal] = useState(false);
  const [selectedSongForPlaylist, setSelectedSongForPlaylist] = useState(null);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSongs, setFilteredSongs] = useState([]);
  const [spotifyToken, setSpotifyToken] = useState(null);
  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [spotifyUser, setSpotifyUser] = useState(null);
  const [spotifyPlaylists, setSpotifyPlaylists] = useState([]);
  const [spotifyTracks, setSpotifyTracks] = useState([]);
  const [isLoadingSpotify, setIsLoadingSpotify] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    if (isPlaying) {
      audioRef.current.play();
    }
  }, [currentSongIndex, isPlaying]);

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const loadSongDuration = (songSrc) => {
    const audio = new Audio(songSrc);
    audio.addEventListener('loadedmetadata', () => {
      setSongDurations(prev => ({
        ...prev,
        [songSrc]: audio.duration
      }));
    });
  };

  useEffect(() => {
    const loadAssets = async () => {
      try {
        const startTime = Date.now();
        
        // Load song durations
        await Promise.all(songs.map(song => loadSongDuration(song.src)));
        
        // Ensure minimum loading time of 2 seconds
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(2000 - elapsedTime, 0);
        
        setTimeout(() => {
          setIsInitialLoading(false);
        }, remainingTime);
        
      } catch (error) {
        console.error('Error loading assets:', error);
        showNotification('Error loading some assets', 'error');
        setIsInitialLoading(false);
      }
    };

    loadAssets();
  }, [songs, showNotification]);

  const toggleMute = () => {
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const generateShuffledPlaylist = () => {
    const indices = Array.from({ length: songs.length }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return indices;
  };

  const toggleShuffle = () => {
    if (!isShuffle) {
      const newShuffledIndices = generateShuffledPlaylist();
      setShuffledIndices(newShuffledIndices);
    }
    setIsShuffle(!isShuffle);
  };

  const playPreviousSong = () => {
    if (currentSongIndex === 0 && !isShuffle) {
      audioRef.current.currentTime = 0;
      return;
    }

    if (audioRef.current.currentTime <= 5) {
      if (isShuffle) {
        const currentShuffleIndex = shuffledIndices.indexOf(currentSongIndex);
        if (currentShuffleIndex === 0) {
          setCurrentSongIndex(shuffledIndices[shuffledIndices.length - 1]);
        } else {
          setCurrentSongIndex(shuffledIndices[currentShuffleIndex - 1]);
        }
      } else {
        setCurrentSongIndex((prevIndex) => prevIndex - 1);
      }
    } else {
      audioRef.current.currentTime = 0;
    }
  };

  const playNextSong = () => {
    if (currentSongIndex === songs.length - 1 && !isShuffle) {
      alert("Please add more songs to the playlist!");
      return;
    }

    if (isShuffle) {
      const currentShuffleIndex = shuffledIndices.indexOf(currentSongIndex);
      if (currentShuffleIndex === shuffledIndices.length - 1) {
        const newShuffledIndices = generateShuffledPlaylist();
        setShuffledIndices(newShuffledIndices);
        setCurrentSongIndex(newShuffledIndices[0]);
      } else {
        setCurrentSongIndex(shuffledIndices[currentShuffleIndex + 1]);
      }
    } else {
      setCurrentSongIndex((prevIndex) => prevIndex + 1);
    }
  };

  const onTimeUpdate = () => {
    setCurrentTime(audioRef.current.currentTime);
  };

  const onLoadedMetadata = () => {
    setDuration(audioRef.current.duration);
  };

  const onProgressChange = (e) => {
    const time = e.target.value;
    setCurrentTime(time);
    audioRef.current.currentTime = time;
  };

  const onVolumeChange = (e) => {
    const volumeValue = e.target.value;
    setVolume(volumeValue);
    audioRef.current.volume = volumeValue;
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const selectSong = (index) => {
    setCurrentSongIndex(index);
    setIsPlaying(true);
  };

  const handleMenuClick = (e, index) => {
    e.stopPropagation();
    setShowMenu(showMenu === index ? null : index);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMenu !== null && 
          !event.target.closest('.menu-btn') && 
          !event.target.closest('.menu-modal')) {
        setShowMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const addToFavorites = (song) => {
    if (!favorites.some(fav => fav.src === song.src)) {
      setFavorites([...favorites, song]);
    }
  };

  const removeFromFavorites = (song) => {
    setFavorites(favorites.filter(fav => fav.src !== song.src));
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3000);
  };

  const addToPlaylist = (song, playlistId) => {
    setPlaylists(playlists.map(playlist => {
      if (playlist.id === playlistId && !playlist.songs.some(s => s.src === song.src)) {
        showNotification(`Added to ${playlist.name}`);
        return { ...playlist, songs: [...playlist.songs, song] };
      }
      return playlist;
    }));
  };

  const createNewPlaylist = () => {
    if (!newPlaylistName.trim()) return;
    
    const newPlaylist = {
      id: Date.now(),
      name: newPlaylistName,
      songs: selectedSongForPlaylist ? [selectedSongForPlaylist] : []
    };
    
    setPlaylists([...playlists, newPlaylist]);
    setNewPlaylistName('');
    setShowAddToPlaylistModal(false);
    showNotification(`Created playlist "${newPlaylistName}"`);
    if (selectedSongForPlaylist) {
      showNotification(`Added song to "${newPlaylistName}"`);
    }
  };

  const renderMenuModal = (song) => (
    <div className="menu-modal" onClick={(e) => e.stopPropagation()}>
      <button 
        className={`menu-btn ${favorites.some(fav => fav.src === song.src) ? 'active' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          if (favorites.some(fav => fav.src === song.src)) {
            removeFromFavorites(song);
            showNotification('Removed from favorites');
          } else {
            addToFavorites(song);
            showNotification('Added to favorites');
          }
          setShowMenu(null);
        }}
      >
        <i className="fas fa-heart"></i>
        {favorites.some(fav => fav.src === song.src) ? 'Remove from Favorites' : 'Add to Favorites'}
      </button>
      <button onClick={(e) => {
        e.stopPropagation();
        setSelectedSongForPlaylist(song);
        setShowAddToPlaylistModal(true);
        setShowMenu(null);
      }}>
        <i className="fas fa-plus"></i>
        Add to Playlist
      </button>
      <button onClick={(e) => {
        e.stopPropagation();
        showNotification('Sharing coming soon!', 'info');
        setShowMenu(null);
      }}>
        <i className="fas fa-share-alt"></i>
        Share
      </button>
    </div>
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showFavorites || showPlaylistModal || showAddToPlaylistModal) {
        if (!event.target.closest('.modal-content')) {
          setShowFavorites(false);
          setShowPlaylistModal(false);
          setShowAddToPlaylistModal(false);
          setSelectedSongForPlaylist(null);
          setNewPlaylistName('');
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFavorites, showPlaylistModal, showAddToPlaylistModal]);

  const playSongFromPlaylist = (song) => {
    const songIndex = songs.findIndex(s => s.src === song.src);
    if (songIndex !== -1) {
      setCurrentSongIndex(songIndex);
      setIsPlaying(true);
    }
  };

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    
    if (!term) {
      setFilteredSongs([]);
      return;
    }

    const filtered = songs.filter(song => 
      song.title.toLowerCase().includes(term) ||
      song.artist.toLowerCase().includes(term)
    );
    setFilteredSongs(filtered);
  };

  const handleSearchSelection = (song) => {
    const newRecent = [song, ...recentSearches.filter(s => s.src !== song.src)].slice(0, 5);
    setRecentSearches(newRecent);
    
    selectSong(songs.findIndex(s => s.src === song.src));
    setSearchTerm('');
    setFilteredSongs([]);
  };

  const connectToSpotify = () => {
    const client_id = '390e579ed2144529aadf98484fdac58d';
    const redirect_uri = window.location.origin;
    const scope = [
      'user-read-private',
      'user-read-email',
      'playlist-read-private',
      'user-library-read',
      'user-top-read',
      'user-read-recently-played',
      'playlist-modify-public',
      'playlist-modify-private'
    ].join(' ');
    
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${client_id}&redirect_uri=${redirect_uri}&scope=${scope}&response_type=token`;
    window.location.href = authUrl;
  };

  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const token = hash.substring(1).split('&').find(elem => elem.startsWith('access_token')).split('=')[1];
      setSpotifyToken(token);
      setSpotifyConnected(true);
      window.location.hash = '';
      
      localStorage.setItem('spotifyToken', token);
    }
  }, []);

  useEffect(() => {
    if (spotifyToken) {
      fetchSpotifyUserProfile();
      fetchSpotifyPlaylists();
      fetchSpotifyTracks();
    }
  }, [spotifyToken, fetchSpotifyUserProfile, fetchSpotifyPlaylists, fetchSpotifyTracks]);

  const fetchSpotifyUserProfile = useCallback(async () => {
    if (!spotifyToken) return;
    
    try {
      const response = await fetch('https://api.spotify.com/v1/me', {
        headers: {
          'Authorization': `Bearer ${spotifyToken}`
        }
      });
      const data = await response.json();
      setSpotifyUser(data);
    } catch (error) {
      console.error('Error fetching Spotify profile:', error);
      showNotification('Failed to fetch Spotify profile', 'error');
    }
  }, [spotifyToken, showNotification]);

  const fetchSpotifyPlaylists = useCallback(async () => {
    if (!spotifyToken) return;
    setIsLoadingSpotify(true);

    try {
      const response = await fetch('https://api.spotify.com/v1/me/playlists', {
        headers: {
          'Authorization': `Bearer ${spotifyToken}`
        }
      });
      const data = await response.json();
      setSpotifyPlaylists(data.items);
    } catch (error) {
      console.error('Error fetching Spotify playlists:', error);
      showNotification('Failed to fetch Spotify playlists', 'error');
    } finally {
      setIsLoadingSpotify(false);
    }
  }, [spotifyToken, showNotification]);

  const fetchSpotifyTracks = useCallback(async () => {
    if (!spotifyToken) return;
    setIsLoadingSpotify(true);

    try {
      const response = await fetch('https://api.spotify.com/v1/me/tracks?limit=50', {
        headers: {
          'Authorization': `Bearer ${spotifyToken}`
        }
      });
      const data = await response.json();
      setSpotifyTracks(data.items.map(item => item.track));
    } catch (error) {
      console.error('Error fetching Spotify tracks:', error);
      showNotification('Failed to fetch Spotify tracks', 'error');
    } finally {
      setIsLoadingSpotify(false);
    }
  }, [spotifyToken, showNotification]);

  const createSpotifyPlaylist = async (name, description = '') => {
    if (!spotifyToken || !spotifyUser) return;

    try {
      const response = await fetch(`https://api.spotify.com/v1/users/${spotifyUser.id}/playlists`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${spotifyToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          description,
          public: false
        })
      });
      const data = await response.json();
      showNotification('Spotify playlist created successfully');
      return data;
    } catch (error) {
      console.error('Error creating Spotify playlist:', error);
      showNotification('Failed to create Spotify playlist', 'error');
    }
  };

  const addToSpotifyPlaylist = async (playlistId, trackUris) => {
    if (!spotifyToken) return;

    try {
      await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${spotifyToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          uris: trackUris
        })
      });
      showNotification('Added to Spotify playlist');
    } catch (error) {
      console.error('Error adding to Spotify playlist:', error);
      showNotification('Failed to add to Spotify playlist', 'error');
    }
  };

  useEffect(() => {
    const loadSavedData = () => {
      // Load favorites
      const savedFavorites = localStorage.getItem('favorites');
      if (savedFavorites) {
        setFavorites(JSON.parse(savedFavorites));
      }

      // Load playlists
      const savedPlaylists = localStorage.getItem('playlists');
      if (savedPlaylists) {
        setPlaylists(JSON.parse(savedPlaylists));
      }

      // Load recent searches
      const savedSearches = localStorage.getItem('recentSearches');
      if (savedSearches) {
        setRecentSearches(JSON.parse(savedSearches));
      }

      // Load theme preference
      const savedTheme = localStorage.getItem('isDarkMode');
      if (savedTheme !== null) {
        setIsDarkMode(JSON.parse(savedTheme));
      }

      // Load volume preference
      const savedVolume = localStorage.getItem('volume');
      if (savedVolume !== null) {
        setVolume(JSON.parse(savedVolume));
        if (audioRef.current) {
          audioRef.current.volume = JSON.parse(savedVolume);
        }
      }
    };

    loadSavedData();
  }, []);

  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('playlists', JSON.stringify(playlists));
  }, [playlists]);

  useEffect(() => {
    localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
  }, [recentSearches]);

  useEffect(() => {
    localStorage.setItem('isDarkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('volume', JSON.stringify(volume));
  }, [volume]);

  useEffect(() => {
    localStorage.setItem('currentSongIndex', currentSongIndex);
    localStorage.setItem('isPlaying', JSON.stringify(isPlaying));
  }, [currentSongIndex, isPlaying]);

  useEffect(() => {
    const savedIndex = localStorage.getItem('currentSongIndex');
    const savedIsPlaying = localStorage.getItem('isPlaying');
    
    if (savedIndex !== null) {
      setCurrentSongIndex(Number(savedIndex));
    }
    
    if (savedIsPlaying !== null) {
      setIsPlaying(JSON.parse(savedIsPlaying));
    }
  }, []);

  const saveToStorage = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error);
      showNotification('Error saving data', 'error');
    }
  };

  const loadFromStorage = (key, defaultValue) => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch (error) {
      console.error(`Error loading ${key} from localStorage:`, error);
      showNotification('Error loading saved data', 'error');
      return defaultValue;
    }
  };

  const SpotifyLoading = () => (
    <div className="spotify-loading">
      <i className="fab fa-spotify fa-spin"></i>
      <span>Loading Spotify data...</span>
    </div>
  );

  if (isInitialLoading) {
    return (
      <div className="loading-screen">
        <i className="fas fa-compact-disc fa-spin"></i>
        <p>Loading your music...</p>
      </div>
    );
  }

  return (
    <div className={`App ${isDarkMode ? 'dark' : 'light'}`}>
      <nav className="side-nav">
        <div className="nav-logo">
          <i className="fas fa-compact-disc"></i>
          <span>Music App</span>
        </div>
        
        <ul className="nav-items">
          <li className="active">
            <i className="fa fa-home"></i>
            <span>Home</span>
          </li>
          <li onClick={() => showNotification('Explore feature coming soon!', 'info')}>
            <i className="fas fa-compass"></i>
            <span>Explore</span>
          </li>
          <li onClick={() => setShowFavorites(true)}>
            <i className="fas fa-heart"></i>
            <span>Favorites</span>
          </li>
          <li onClick={() => setShowPlaylistModal(true)}>
            <i className="fas fa-stream"></i>
            <span>Playlists</span>
          </li>
        </ul>

        <div className="nav-options">
          <button onClick={() => setIsDarkMode(!isDarkMode)}>
            <i className={`fas ${isDarkMode ? 'fa-sun' : 'fa-moon'}`}></i>
            <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          <button onClick={connectToSpotify} className={spotifyConnected ? 'connected' : ''}>
            <i className="fab fa-spotify"></i>
            <span>{spotifyConnected ? 'Connected to Spotify' : 'Connect Spotify'}</span>
          </button>
        </div>
      </nav>

      <div className="main-container">
        <nav className="top-nav">
          <div className="search-container">
            <i className="fas fa-search"></i>
            <input 
              type="text" 
              placeholder="Search for songs..." 
              value={searchTerm}
              onChange={handleSearch}
            />
            {(searchTerm || recentSearches.length > 0) && (
              <div className="search-results">
                {searchTerm ? (
                  <>
                    <div className="search-section">
                      <h4>Search Results</h4>
                      {filteredSongs.length > 0 ? (
                        filteredSongs.map((song, index) => (
                          <div 
                            key={index} 
                            className="search-result-item"
                            onClick={() => handleSearchSelection(song)}
                          >
                            <img src={song.img_src} alt={song.title} />
                            <div className="song-info">
                              <h4>{song.title}</h4>
                              <p>{song.artist}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="empty-message">No results found</p>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="search-section">
                    <div className="section-header">
                      <h4>Recent Searches</h4>
                      {recentSearches.length > 0 && (
                        <button 
                          className="clear-btn"
                          onClick={() => setRecentSearches([])}
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    {recentSearches.map((song, index) => (
                      <div 
                        key={index} 
                        className="search-result-item"
                        onClick={() => handleSearchSelection(song)}
                      >
                        <img src={song.img_src} alt={song.title} />
                        <div className="song-info">
                          <h4>{song.title}</h4>
                          <p>{song.artist}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="profile-container">
            <button className="profile-btn">
              <i className="fas fa-user-circle"></i>
            </button>
          </div>
        </nav>

        <main className="main-content">
          <div className="music-player">
            <div className="player-header">
              <button 
                className="menu-btn"
                onClick={() => setShowMenu('player')}
              >
                <i className="fas fa-ellipsis-v"></i>
              </button>
              {showMenu === 'player' && renderMenuModal(songs[currentSongIndex])}
            </div>
            <div className="song-image">
              <img src={songs[currentSongIndex].img_src} alt="song cover" />
            </div>
            
            <div className="song-details">
              <h2>{songs[currentSongIndex].title}</h2>
              <h3>{songs[currentSongIndex].artist}</h3>
            </div>

            <div className="progress">
              <span className="time current">{formatTime(currentTime)}</span>
              <input 
                type="range"
                className="progress-bar"
                min="0"
                max={duration}
                value={currentTime}
                onChange={onProgressChange}
              />
              <span className="time">{formatTime(duration)}</span>
            </div>

            <div className="controls">
              <button 
                className={`control-btn ${currentSongIndex === 0 && !isShuffle ? 'disabled' : ''}`}
                onClick={playPreviousSong}
                disabled={currentSongIndex === 0 && !isShuffle}
              >
                <i className="fas fa-backward"></i>
              </button>
              <button 
                className={`control-btn play ${isPlaying ? 'playing' : ''}`} 
                onClick={togglePlay}
              >
                <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
              </button>
              <button 
                className={`control-btn ${currentSongIndex === songs.length - 1 && !isShuffle ? 'disabled' : ''}`}
                onClick={playNextSong}
                disabled={currentSongIndex === songs.length - 1 && !isShuffle}
              >
                <i className="fas fa-forward"></i>
              </button>
              <button className={`control-btn ${isShuffle ? 'active' : ''}`} onClick={toggleShuffle}>
                <i className="fas fa-random"></i>
              </button>
            </div>

            <div className="volume-control">
              <button className="control-btn" onClick={toggleMute}>
                <i className={`fas ${isMuted ? 'fa-volume-mute' : 'fa-volume-up'}`}></i>
              </button>
              <input 
                type="range"
                className="volume-slider"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={onVolumeChange}
              />
            </div>

            <audio 
              ref={audioRef}
              src={songs[currentSongIndex].src}
              onTimeUpdate={onTimeUpdate}
              onLoadedMetadata={onLoadedMetadata}
              onEnded={playNextSong}
            />
          </div>

          <div className="song-list">
            <h2>All Songs</h2>
            <div className="songs">
              {songs.map((song, index) => (
                <div 
                  key={index} 
                  className={`song-item ${currentSongIndex === index ? 'active' : ''}`}
                  onClick={() => selectSong(index)}
                >
                  <img src={song.img_src} alt={song.title} />
                  <div className="song-info">
                    <div className="text-content">
                      <h3>{song.title}</h3>
                      <p>{song.artist}</p>
                    </div>
                    <span className="song-duration">
                      {songDurations[song.src] ? formatTime(songDurations[song.src]) : '--:--'}
                    </span>
                  </div>
                  <button 
                    className="menu-btn"
                    onClick={(e) => handleMenuClick(e, index)}
                  >
                    <i className="fas fa-ellipsis-v"></i>
                  </button>
                  {showMenu === index && renderMenuModal(song)}
                  {currentSongIndex === index && isPlaying && (
                    <div className="playing-animation">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      {showFavorites && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <div className="modal-title">
                <i className="fas fa-heart"></i>
                <h2>Favorites</h2>
              </div>
              <button onClick={() => setShowFavorites(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              {favorites.length === 0 ? (
                <p className="empty-message">No favorites yet</p>
              ) : (
                favorites.map((song, index) => (
                  <div 
                    key={index} 
                    className={`modal-song-item ${currentSongIndex === songs.findIndex(s => s.src === song.src) ? 'active' : ''}`}
                    onClick={() => playSongFromPlaylist(song)}
                  >
                    <img src={song.img_src} alt={song.title} />
                    <div className="song-info">
                      <h3>{song.title}</h3>
                      <p>{song.artist}</p>
                    </div>
                    <button onClick={(e) => {
                      e.stopPropagation();
                      removeFromFavorites(song);
                      showNotification('Removed from favorites');
                    }}>
                      <i className="fas fa-trash"></i>
                    </button>
                    {currentSongIndex === songs.findIndex(s => s.src === song.src) && isPlaying && (
                      <div className="playing-animation">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {showPlaylistModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <div className="modal-title">
                <i className="fas fa-stream"></i>
                <h2>Playlists</h2>
              </div>
              <button onClick={() => setShowPlaylistModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              {playlists.map(playlist => (
                <div key={playlist.id} className="playlist-section">
                  <div className="playlist-header">
                    <h3>{playlist.name}</h3>
                    <span className="song-count">{playlist.songs.length} songs</span>
                  </div>
                  {playlist.songs.length === 0 ? (
                    <p className="empty-message">No songs in this playlist</p>
                  ) : (
                    <div className="playlist-songs">
                      {playlist.songs.map((song, index) => (
                        <div 
                          key={index} 
                          className={`modal-song-item ${currentSongIndex === songs.findIndex(s => s.src === song.src) ? 'active' : ''}`}
                          onClick={() => playSongFromPlaylist(song)}
                        >
                          <img src={song.img_src} alt={song.title} />
                          <div className="song-info">
                            <h3>{song.title}</h3>
                            <p>{song.artist}</p>
                          </div>
                          <button onClick={(e) => {
                            e.stopPropagation();
                            setPlaylists(playlists.map(p => 
                              p.id === playlist.id 
                                ? { ...p, songs: p.songs.filter(s => s.src !== song.src) }
                                : p
                            ));
                            showNotification('Removed from playlist');
                          }}>
                            <i className="fas fa-trash"></i>
                          </button>
                          {currentSongIndex === songs.findIndex(s => s.src === song.src) && isPlaying && (
                            <div className="playing-animation">
                              <span></span>
                              <span></span>
                              <span></span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showAddToPlaylistModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <div className="modal-title">
                <i className="fas fa-plus"></i>
                <h2>Add to Playlist</h2>
              </div>
              <button onClick={() => {
                setShowAddToPlaylistModal(false);
                setSelectedSongForPlaylist(null);
                setNewPlaylistName('');
              }}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="create-playlist">
                <input
                  type="text"
                  placeholder="Create new playlist"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                />
                <button 
                  className="create-btn"
                  onClick={createNewPlaylist}
                  disabled={!newPlaylistName.trim()}
                >
                  Create
                </button>
              </div>
              <div className="playlist-list">
                <h3>Existing Playlists</h3>
                {playlists.map(playlist => (
                  <button
                    key={playlist.id}
                    className="playlist-option"
                    onClick={() => {
                      addToPlaylist(selectedSongForPlaylist, playlist.id);
                      setShowAddToPlaylistModal(false);
                      setSelectedSongForPlaylist(null);
                    }}
                  >
                    <i className="fas fa-list"></i>
                    <span>{playlist.name}</span>
                    <span className="song-count">{playlist.songs.length}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {notification.show && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      {isLoadingSpotify && <SpotifyLoading />}
    </div>
  );
}

export default App;
