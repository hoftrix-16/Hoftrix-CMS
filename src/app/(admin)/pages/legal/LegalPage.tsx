import { useState } from 'react';
import { Scale, Plus, Trash2} from 'lucide-react';

const LegalConfig = () => {
  const [legalDocs, setLegalDocs] = useState([
    { id: 1, type: 'Privacy Policy', url: 'https://hoftrix.com/privacy-policy' },
    { id: 2, type: 'Terms & Conditions', url: 'https://hoftrix.com/terms-and-conditions' },
    { id: 3, type: 'Disclaimer', url: 'https://hoftrix.com/disclaimer' }
  ]);

  const handleAddDoc = () => {
    setLegalDocs([
      ...legalDocs,
      { id: Date.now(), type: 'Privacy Policy', url: '' }
    ]);
  };

 const handleRemoveDoc = (id: number) => {
  setLegalDocs(legalDocs.filter(item => item.id !== id));
};

const handleChange = (
  id: number,
  field: 'type' | 'url',
  value: string
) => {
  setLegalDocs(
    legalDocs.map(item =>
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
            <Scale size={22} className="text-white" />
            Legal Configuration
          </h4>
          <p className="text-secondary small mb-0">
            Manage your legal documents, terms, and privacy policies.
          </p>
        </div>
        
        <button 
          onClick={handleAddDoc}
          className="btn btn-outline-info text-cyan d-flex align-items-center gap-1 rounded-3 px-3 py-2 fw-medium hover-none"
          style={{ borderColor: '#0ea5e9', color: '#38bdf8' }}
        >
          <Plus size={18} />
          Add Legal Document
        </button>
      </div>

      {/* Dynamic Link Cards */}
      <div className="d-flex flex-column gap-3">
        {legalDocs.map((item) => (
          <div 
            key={item.id} 
            className="p-3 rounded-4 d-flex align-items-center gap-3"
            style={{ 
              backgroundColor: '#111827', 
              border: '1px solid rgba(255, 255, 255, 0.08)' 
            }}
          >
            {/* Document Type Select */}
            <div style={{ width: '220px' }}>
              <label className="form-label text-uppercase text-secondary fw-bold mb-1" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>
                DOCUMENT TYPE
              </label>
              <select 
                className="form-select text-white border-secondary border-opacity-25 shadow-none"
                value={item.type}
                onChange={(e) => handleChange(item.id, 'type', e.target.value)}
                style={{ backgroundColor: '#1f2937', borderRadius: '10px' }}
              >
                <option value="Privacy Policy">Privacy Policy</option>
                <option value="Terms & Conditions">Terms & Conditions</option>
                <option value="Disclaimer">Disclaimer</option>
                <option value="Cookie Policy">Cookie Policy</option>
                <option value="Refund Policy">Refund Policy</option>
              </select>
            </div>

            {/* URL / Link Input */}
            <div className="flex-grow-1">
              <label className="form-label text-uppercase text-secondary fw-bold mb-1" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>
                URL / PAGE LINK
              </label>
              <input 
                type="text" 
                className="form-control text-white border-secondary border-opacity-25 shadow-none"
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
                onClick={() => handleRemoveDoc(item.id)}
                className="btn btn-link text-danger p-2 shadow-none border-0"
                title="Remove document"
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

export default LegalConfig;