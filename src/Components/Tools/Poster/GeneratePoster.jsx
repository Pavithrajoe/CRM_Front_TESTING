import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, X, UploadCloud, Trash2 } from 'lucide-react';
import { jwtDecode } from 'jwt-decode';

const apiEndPoint = import.meta.env.VITE_API_URL;
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

const GeneratePoster = () => {
  const [image, setImage] = useState(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [phone, setPhone] = useState('123-456-7890');
  const [fontSize, setFontSize] = useState(48);
  const [fontColor, setFontColor] = useState('#ffffff');
  const [fontFamily, setFontFamily] = useState('Arial, sans-serif');
  const [isDragging, setIsDragging] = useState(false);
  const [textPosition, setTextPosition] = useState({ x: 0.5, y: 0.5 });
  const [showTemplates, setShowTemplates] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [posterTemplates, setPosterTemplates] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [posterToDelete, setPosterToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const posterRef = useRef(null);
  const imageRef = useRef(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const getToken = () => localStorage.getItem('token');

  const getDecodedToken = () => {
    const token = getToken();
    if (token) {
      try {
        return jwtDecode(token);
      } catch (error) {
        console.error('Failed to decode token:', error);
        return null;
      }
    }
    return null;
  };

  const fetchUserPhone = useCallback(async (userId) => {
    try {
      const res = await fetch(`${apiEndPoint}/users/${userId}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (data && data.i_bPhone_no) {
        setPhone(data.i_bPhone_no);
      }
    } catch (error) {
      console.error('Failed to fetch user phone number:', error);
    }
  }, []);

  useEffect(() => {
    const decoded = getDecodedToken();
    if (decoded) {
      setUserRole(decoded.roleType);
      fetchUserPhone(decoded.user_id);
    }
  }, [fetchUserPhone]);

  const fetchPosterTemplates = useCallback(() => {
    fetch(`${apiEndPoint}/poster`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const templatesArray = Array.isArray(data) ? data : data.data;
        if (Array.isArray(templatesArray)) {
          const formattedTemplates = templatesArray.map((item) => {
            let posterUrl = item.poster_url;
            if (posterUrl && !posterUrl.startsWith('http') && !posterUrl.startsWith('data:')) {
              posterUrl = `${apiBaseUrl}${posterUrl}`;
            }
            return { id: item.poster_id, name: item.cPoster_name, url: posterUrl };
          });
          setPosterTemplates(formattedTemplates.reverse());
        } else {
          console.error('Unexpected data structure for poster templates:', data);
        }
      })
      .catch((err) => console.error('Failed to fetch poster templates:', err));
  }, []);

  useEffect(() => {
    fetchPosterTemplates();
  }, [fetchPosterTemplates]);

  const loadImageAndSetState = (url) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      setImage(url);
      setShowTemplates(false);
      setTextPosition({ x: 0.5, y: 0.5 });
    };
    img.onerror = () => {
      console.error('Failed to load image:', url);
      alert('Failed to load image. Please try another one.');
      setIsUploading(false);
      setImage(null);
    };
    img.src = url;
  };

  const handleImageUploadAndSave = useCallback(
    (e) => {
      const file = e.target.files[0];
      if (!file) return;

      setIsUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Image = reader.result;
        loadImageAndSetState(base64Image);

        const formData = new FormData();
        const fileName = file.name.split('.').slice(0, -1).join('.');
        formData.append('cPoster_name', fileName);
        formData.append('poster_file', file);

        fetch(`${apiEndPoint}/poster`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${getToken()}` },
          body: formData,
        })
          .then((res) => res.json())
          .then(() => {
            setIsUploading(false);
            fetchPosterTemplates();
          })
          .catch((err) => {
            console.error('Upload failed:', err);
            alert('Failed to upload poster.');
            setIsUploading(false);
          });
      };
      reader.readAsDataURL(file);
    },
    [fetchPosterTemplates]
  );

  const handleSelectTemplate = useCallback((url) => {
    setTextPosition({ x: 0.5, y: 0.5 });
    loadImageAndSetState(url);
  }, []);

  const handleMouseDown = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setIsDragging(true);
    setTextPosition({ x: x / rect.width, y: y / rect.height });
  }, []);

  const handleMouseMove = useCallback(
    (e) => {
      if (isDragging) {
        const rect = imageRef.current.getBoundingClientRect();
        let newX = e.clientX - rect.left;
        let newY = e.clientY - rect.top;

        newX = Math.max(0, Math.min(newX, rect.width));
        newY = Math.max(0, Math.min(newY, rect.height));

        setTextPosition({ x: newX / rect.width, y: newY / rect.height });
      }
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const handleDownload = () => {
    if (!imageRef.current || !image) {
      alert('Please select or upload a poster first.');
      return;
    }

    setIsDownloading(true);

    const canvas = document.createElement('canvas');
    canvas.width = imageDimensions.width;
    canvas.height = imageDimensions.height;
    const ctx = canvas.getContext('2d');

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = image;

    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      ctx.fillStyle = fontColor;
      // Calculate font size
      const displayedHeight = imageRef.current.offsetHeight;
      const proportionalFontSize = (fontSize / displayedHeight) * canvas.height;
      ctx.font = `${proportionalFontSize}px ${fontFamily}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const textX = textPosition.x * canvas.width;
      const textY = textPosition.y * canvas.height;

      ctx.fillText(phone, textX, textY);

      const link = document.createElement('a');
      link.download = 'generated-poster.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
      setIsDownloading(false);
    };

    img.onerror = () => {
      console.error('Failed to load image for canvas.');
      alert('Failed to generate poster for download.');
      setIsDownloading(false);
    };
  };

  const handleShowTemplates = () => {
    setShowTemplates(true);
    setImage(null);
  };

  const handleBackMove = () => {
    setShowTemplates(true);
    setImage(null);
    navigate('/active-leads');
  };

  const isSuperAdmin = userRole === 'Super_admin';

  const openDeleteModal = (posterId) => {
    setPosterToDelete(posterId);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setPosterToDelete(null);
    setShowDeleteModal(false);
  };

  const handleDeletePoster = async () => {
    if (!posterToDelete) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`${apiEndPoint}/poster/${posterToDelete}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (res.ok) {
        fetchPosterTemplates();
      } else {
        const errorData = await res.json();
        alert(`Failed to delete poster: ${errorData.Message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Delete request failed:', error);
      alert('Failed to delete poster. Internal server error.');
    } finally {
      setIsDeleting(false);
      closeDeleteModal();
    }
  };

  return (
    <div className="flex flex-row items-stretch justify-center p-4 md:p-12 bg-gray-100 min-h-screen font-sans gap-6">
      {/* Left Side */}
      <div className={`w-full ${isSuperAdmin ? 'md:w-2/3' : 'md:w-full'} flex flex-col items-center justify-center`}>
        {image && !showTemplates && (
          <div
            className="relative max-h-[70vh] rounded-3xl overflow-hidden shadow-2xl border border-gray-200 bg-white flex flex-col justify-center items-center"
            style={{
              aspectRatio: `${imageDimensions.width} / ${imageDimensions.height}`,
              maxWidth: '100%',
              width: 'auto',
            }}
          >
            <div ref={posterRef} className="relative w-full h-full">
              <img ref={imageRef} src={image} alt="Poster" className="w-full h-full object-contain" />
              <div
                className="absolute cursor-grab active:cursor-grabbing z-10"
                style={{
                  top: `${textPosition.y * 100}%`,
                  left: `${textPosition.x * 100}%`,
                  transform: 'translate(-50%, -50%)',
                  fontSize: `${fontSize}px`,
                  color: fontColor,
                  fontFamily: fontFamily,
                  userSelect: 'none',
                }}
                onMouseDown={handleMouseDown}
              >
                {phone}
              </div>
            </div>
            <button
              onClick={handleShowTemplates}
              className="absolute top-4 left-4 bg-white bg-opacity-80 border border-gray-300 rounded-full px-4 py-1 text-xs font-bold shadow hover:bg-opacity-100 transition z-20"
            >
              Choose from My Posters
            </button>
          </div>
        )}

        {showTemplates && (
          <div className="w-full flex flex-col items-center">
            <div className="w-full max-w-xl mb-6">
              <input
                type="text"
                placeholder="Search posters by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-3 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
            <div className={`w-full grid grid-cols-1 sm:grid-cols-2 ${isSuperAdmin ? 'md:grid-cols-3' : 'md:grid-cols-4'} gap-6 mb-8`}>
              {posterTemplates
                .filter((tmpl) =>
                  tmpl.name.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((tmpl) => (
                  <div
                    key={tmpl.id}
                    className="group relative border-2 border-gray-300 rounded-3xl overflow-hidden shadow hover:ring-4 hover:ring-blue-200 cursor-pointer transition"
                  >
                    <img
                      src={tmpl.url}
                      alt={tmpl.name}
                      className="w-full h-48 object-cover"
                      onClick={() => handleSelectTemplate(tmpl.url)}
                    />
                    <div
                      className="absolute bottom-0 w-full text-center bg-black bg-opacity-50 text-white font-semibold py-2 group-hover:bg-opacity-80"
                      onClick={() => handleSelectTemplate(tmpl.url)}
                    >
                      {tmpl.name}
                    </div>
                    {isSuperAdmin && (
                      <button
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDeleteModal(tmpl.id);
                        }}
                        aria-label="Delete poster"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Right Side */}
      <div className={`w-full md:w-1/3 relative flex flex-col items-center justify-start ${!isSuperAdmin && showTemplates ? 'hidden md:flex' : ''}`}>
        {showTemplates && isSuperAdmin && (
          <div className="relative w-full">
            <button
              onClick={handleBackMove}
              className="absolute top-4 right-4 z-20 p-3 rounded-full bg-red-500 text-white hover:bg-red-600 transition shadow-lg"
              aria-label="Close"
            >
              <X size={24} />
            </button>
            <label className="flex flex-col items-center justify-center w-full min-h-[12rem] border-4 border-dashed border-gray-300 rounded-3xl cursor-pointer bg-white hover:bg-gray-50 transition p-8 text-center mt-6">
              <UploadCloud size={64} className="text-gray-400 mb-4" />
              <span className="font-bold mb-2">{isUploading ? 'Uploading...' : 'Upload Poster'}</span>
              <span className="text-xs text-gray-500 mb-1">PNG, JPG, JPEG (MAX 5MB)</span>
              <input
                type="file"
                className="hidden"
                accept="image/png, image/jpeg, image/jpg"
                onChange={handleImageUploadAndSave}
                ref={fileInputRef}
                disabled={isUploading}
              />
            </label>
          </div>
        )}

        {image && !showTemplates && (
          <div className="relative w-full">
            <button
              onClick={handleShowTemplates}
              className="absolute top-4 right-4 z-20 p-3 rounded-full bg-red-500 text-white hover:bg-red-600 transition shadow-lg"
              aria-label="Close"
            >
              <X size={24} />
            </button>
            <div className="w-full mt-10 p-6 bg-white rounded-2xl shadow-xl border border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Customize Your Poster</h2>
              <div className="flex flex-col space-y-4">
                <div className="flex flex-col">
                  <label htmlFor="phone" className="text-xs font-medium text-gray-500">
                    Enter Your Text
                  </label>
                  <input
                    id="phone"
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm"
                    placeholder="Enter new text"
                  />
                </div>
                <div className="flex flex-col">
                  <label htmlFor="fontSize" className="text-xs font-medium text-gray-500">
                    Font Size
                  </label>
                  <input
                    id="fontSize"
                    type="number"
                    value={fontSize}
                    onChange={(e) => setFontSize(e.target.value)}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm text-right"
                  />
                </div>
                <div className="flex flex-col">
                  <label htmlFor="fontColor" className="text-xs font-medium text-gray-500">
                    Font Color
                  </label>
                  <input
                    id="fontColor"
                    type="color"
                    value={fontColor}
                    onChange={(e) => setFontColor(e.target.value)}
                    className="w-full h-8 rounded-lg border border-gray-200 cursor-pointer bg-white"
                  />
                </div>
                <div className="flex flex-col">
                  <label htmlFor="fontFamily" className="text-xs font-medium text-gray-500">
                    Font Family
                  </label>
                  <select
                    id="fontFamily"
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value)}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm"
                  >
                    <option value="Arial, sans-serif">Arial</option>
                    <option value="Helvetica, sans-serif">Helvetica</option>
                    <option value="Times New Roman, serif">Times New Roman</option>
                    <option value="Courier New, monospace">Courier New</option>
                    <option value="Georgia, serif">Georgia</option>
                    <option value="Verdana, sans-serif">Verdana</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="w-full mt-6 px-6 py-3 rounded-full text-white text-sm font-semibold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 transition duration-300 shadow-lg flex items-center justify-center space-x-2 disabled:bg-gray-400 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed"
              >
                {isDownloading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    <span>Download Poster</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Confirm Deletion</h3>
            <p className="text-sm text-gray-600 mb-6">Are you sure you want to delete this poster? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={closeDeleteModal}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePoster}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition disabled:bg-red-400 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeneratePoster;