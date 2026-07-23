const mongoose = require('mongoose');
const mongoURI = 'mongodb://127.0.0.1:27017/hoftrix_db';

mongoose.connect(mongoURI).then(async () => {
  console.log('Connected to MongoDB successfully!');
  
  const ProjectSchema = new mongoose.Schema({
    status: String,
    progress: Number
  }, { strict: false });
  
  const Project = mongoose.models.Project || mongoose.model('Project', ProjectSchema);
  
  // Update all completed projects to have 100% progress
  const result = await Project.updateMany({ status: 'Completed' }, { progress: 100 });
  console.log('Successfully synchronized completed projects count:', result.modifiedCount);
  mongoose.disconnect();
}).catch(err => console.error(err));
