import  { useState } from 'react';
import { Share2, Plus, Trash2 } from 'lucide-react';

const SocialMediaConfig = () => {
  const [socialLinks, setSocialLinks] = useState([
    { id: 1, platform: 'Facebook', url: 'https://www.facebook.com/hoftrix' },
    { id: 2, platform: 'LinkedIn', url: 'http://linkedin.com/company/hoftrix' },
    { id: 3, platform: 'Instagram', url: 'https://www.instagram.com/hoftrix/' }
  ]);

  const handleAddLink = () => {
    setSocialLinks([
      ...socialLinks,
      { id: Date.now(), platform: 'Facebook', url: '' }
    ]);
  };
const handleRemoveLink = (id: number) => {
  setSocialLinks(
    socialLinks.filter(item => item.id !== id)
  );
};

const handleChange = (
  id: number,
  field: 'platform' | 'url',
  value: string
) => {
  setSocialLinks(
    socialLinks.map(item =>
      item.id === id
        ? { ...item, [field]: value }
        : item
    )
  );
};

  return (
    <div className="container-fluid text-white p-4" style={{ backgroundColor: '#0b0f19', minHeight: '100vh' }}>
      
      {/* Header Section */}
      <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom border-secondary border-opacity-25">
        <div>
          <h4 className="fw-bold d-flex align-items-center gap-2 mb-1">
            <Share2 size={22} className="text-white" />
            Social Media Configuration
          </h4>
          <p className="text-secondary small mb-0">
            Configure your dynamic social media footprints.
          </p>
        </div>
        
        <button 
          onClick={handleAddLink}
          className="btn btn-outline-info text-cyan d-flex align-items-center gap-1 rounded-3 px-3 py-2 fw-medium"
          style={{ borderColor: '#0ea5e9', color: '#38bdf8' }}
        >
          <Plus size={18} />
          Add Social Link
        </button>
      </div>

      {/* Dynamic Link Cards */}
      <div className="d-flex flex-column gap-3">
        {socialLinks.map((item) => (
          <div 
            key={item.id} 
            className="p-3 rounded-4 d-flex align-items-center gap-3"
            style={{ 
              backgroundColor: '#111827', 
              border: '1px solid rgba(255, 255, 255, 0.08)' 
            }}
          >
            {/* Platform Select */}
            <div style={{ width: '220px' }}>
              <label className="form-label text-uppercase text-secondary fw-bold mb-1" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>
                PLATFORM
              </label>
              <select 
                className="form-select text-white border-secondary border-opacity-25 shadow-none"
                value={item.platform}
                onChange={(e) => handleChange(item.id, 'platform', e.target.value)}
                style={{ backgroundColor: '#1f2937', borderRadius: '10px' }}
              >
                <option value="Facebook">Facebook</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Instagram">Instagram</option>
                <option value="Twitter">Twitter / X</option>
                <option value="YouTube">YouTube</option>
              </select>
            </div>

            {/* URL Input */}
            <div className="flex-grow-1">
              <label className="form-label text-uppercase text-secondary fw-bold mb-1" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>
                URL
              </label>
              <input 
                type="text" 
                className="form-input form-control text-white border-secondary border-opacity-25 shadow-none"
                placeholder="https://"
                value={item.url}
                onChange={(e) => handleChange(item.id, 'url', e.target.value)}
                style={{ backgroundColor: '#1f2937', borderRadius: '10px' }}
              />
            </div>

            {/* Delete Button */}
            <div className="d-flex align-items-end pt-4">
              <button 
                type="button" 
                onClick={() => handleRemoveLink(item.id)}
                className="btn btn-link text-danger p-2 shadow-none border-0"
                title="Remove link"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

export default SocialMediaConfig;