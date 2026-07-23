const mongoose = require('mongoose');
const mongoURI = 'mongodb://127.0.0.1:27017/hoftrix_db';

mongoose.connect(mongoURI)
  .then(async () => {
    console.log('Connected to MongoDB successfully!');
    
    // Minimal Inline Schema for dynamic updates
    const ProjectSchema = new mongoose.Schema({
      name: String,
      clientWebsite: String,
      clientPhone: String,
      clientEmail: String
    }, { strict: false });
    
    // Use existing model or compile
    const Project = mongoose.models.Project || mongoose.model('Project', ProjectSchema);
    
    // Apply updates to all projects
    const result = await Project.updateMany({}, {
      clientWebsite: 'www.hoftrix.com',
      clientPhone: '+919797031229',
      clientEmail: 'hoftrix16@gmail.com'
    });
    
    console.log('Successfully updated projects count:', result.modifiedCount);
    mongoose.disconnect();
  })
  .catch(err => {
    console.error('Connection failed:', err);
  });
