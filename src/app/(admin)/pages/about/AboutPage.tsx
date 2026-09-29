import { useState } from 'react';
import type { MouseEvent } from 'react';
import { Info, Save, Building, Mail, Phone, MapPin } from 'lucide-react';

const AboutConfig = () => {
 const [aboutData, setAboutData] = useState({
  companyName: 'Hoftrix',
  tagline: 'Pioneering Innovative Technology Solutions & Expert IT Services Worldwide',
  establishedYear: '2025',
  email: 'info@hoftrix.com',
  phone: '+91 98765 43210', 
  address: 'Sunny Enclave Sector-125, Chandigarh',
  description: 'Hoftrix is a next-gen Web Development & Digital Marketing Agency committed to helping businesses grow. We combine smart UI/UX design, clean development, AI-powered SEO, and performance-driven marketing to build digital experiences that scale, convert, and stand out.'
});

  const handleChange = (field: string, value: string) => {
    setAboutData(prev => ({
      ...prev,
      [field]: value
    }));
  };

 const handleSubmit = (e: MouseEvent<HTMLButtonElement>) => {
  e.preventDefault();
  console.log('Saved About Data:', aboutData);
};

  return (
    <div className="container-fluid text-white p-4" style={{ backgroundColor: '#0b0f19', minHeight: '100vh' }}>
      
      {/* Header Section */}
      <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom border-secondary border-opacity-25">
        <div>
          <h4 className="fw-bold d-flex align-items-center gap-2 mb-1">
            <Info size={22} className="text-white" />
            About Us Configuration
          </h4>
          <p className="text-secondary small mb-0">
            Manage your brand profile, company overview, and public contact information.
          </p>
        </div>
        
        <button 
          onClick={handleSubmit}
          className="btn btn-outline-info text-cyan d-flex align-items-center gap-1 rounded-3 px-3 py-2 fw-medium"
          style={{ borderColor: '#0ea5e9', color: '#38bdf8' }}
        >
          <Save size={18} />
          Save Changes
        </button>
      </div>

      {/* Main Content Card */}
      <div 
        className="p-4 rounded-4 d-flex flex-column gap-4"
        style={{ 
          backgroundColor: '#111827', 
          border: '1px solid rgba(255, 255, 255, 0.08)' 
        }}
      >
        {/* Row 1: Company Name & Tagline */}
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label text-uppercase text-secondary fw-bold mb-1" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>
              COMPANY / BRAND NAME
            </label>
            <div className="input-group">
              <span className="input-group-text border-secondary border-opacity-25 text-secondary" style={{ backgroundColor: '#1f2937' }}>
                <Building size={18} />
              </span>
              <input 
                type="text" 
                className="form-control text-white border-secondary border-opacity-25 shadow-none"
                value={aboutData.companyName}
                onChange={(e) => handleChange('companyName', e.target.value)}
                style={{ backgroundColor: '#1f2937' }}
              />
            </div>
          </div>

          <div className="col-md-6">
            <label className="form-label text-uppercase text-secondary fw-bold mb-1" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>
              TAGLINE
            </label>
            <input 
              type="text" 
              className="form-control text-white border-secondary border-opacity-25 shadow-none"
              value={aboutData.tagline}
              onChange={(e) => handleChange('tagline', e.target.value)}
              style={{ backgroundColor: '#1f2937', borderRadius: '10px' }}
            />
          </div>
        </div>

        {/* Row 2: Description */}
        <div>
          <label className="form-label text-uppercase text-secondary fw-bold mb-1" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>
            ABOUT / BIO DESCRIPTION
          </label>
          <textarea 
            rows={4}
            className="form-control text-white border-secondary border-opacity-25 shadow-none"
            value={aboutData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            style={{ backgroundColor: '#1f2937', borderRadius: '10px', resize: 'vertical' }}
          />
        </div>

        {/* Row 3: Contact Info */}
        <div className="row g-3">
          <div className="col-md-4">
            <label className="form-label text-uppercase text-secondary fw-bold mb-1" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>
              SUPPORT EMAIL
            </label>
            <div className="input-group">
              <span className="input-group-text border-secondary border-opacity-25 text-secondary" style={{ backgroundColor: '#1f2937' }}>
                <Mail size={18} />
              </span>
              <input 
                type="email" 
                className="form-control text-white border-secondary border-opacity-25 shadow-none"
                value={aboutData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                style={{ backgroundColor: '#1f2937' }}
              />
            </div>
          </div>

          <div className="col-md-4">
            <label className="form-label text-uppercase text-secondary fw-bold mb-1" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>
              CONTACT PHONE
            </label>
            <div className="input-group">
              <span className="input-group-text border-secondary border-opacity-25 text-secondary" style={{ backgroundColor: '#1f2937' }}>
                <Phone size={18} />
              </span>
              <input 
                type="text" 
                className="form-control text-white border-secondary border-opacity-25 shadow-none"
                value={aboutData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                style={{ backgroundColor: '#1f2937' }}
              />
            </div>
          </div>

          <div className="col-md-4">
            <label className="form-label text-uppercase text-secondary fw-bold mb-1" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>
              OFFICE LOCATION
            </label>
            <div className="input-group">
              <span className="input-group-text border-secondary border-opacity-25 text-secondary" style={{ backgroundColor: '#1f2937' }}>
                <MapPin size={18} />
              </span>
              <input 
                type="text" 
                className="form-control text-white border-secondary border-opacity-25 shadow-none"
                value={aboutData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                style={{ backgroundColor: '#1f2937' }}
              />
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default AboutConfig;