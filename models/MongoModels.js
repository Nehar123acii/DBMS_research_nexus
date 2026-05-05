const mongoose = require('mongoose');

// 1. Paper Model (Flexible metadata for different domains)
const PaperSchema = new mongoose.Schema({
    title: { type: String, required: true },
    domain: { type: String, required: true },
    authors: [String], // Array of author names or Postgres IDs
    date: { type: Date, default: Date.now },
    metadata: mongoose.Schema.Types.Mixed, // Flexible field for sequences vs code
    rating: String,
    status: { type: String, default: 'Published' }
}, { strict: false }); // strict false allows arbitrary metadata

const Paper = mongoose.model('Paper', PaperSchema);

// 2. Dataset Model
const DatasetSchema = new mongoose.Schema({
    title: { type: String, required: true },
    uploader: { type: String, required: true },
    size: String,
    format: String,
    schemaStructure: [{ field: String, type: { type: String } }],
    downloads: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

const Dataset = mongoose.model('Dataset', DatasetSchema);

// 3. Review Model
const ReviewSchema = new mongoose.Schema({
    paperId: { type: mongoose.Schema.Types.ObjectId, ref: 'Paper', required: true },
    paperTitle: String,
    reviewer: { type: String, required: true },
    comments: String,
    status: { type: String, enum: ['Pending', 'Accepted', 'Rejected'], default: 'Pending' },
    date: { type: Date, default: Date.now }
});

const Review = mongoose.model('Review', ReviewSchema);

// 4. Version History Model (GitHub style commits)
const VersionSchema = new mongoose.Schema({
    paperId: { type: mongoose.Schema.Types.ObjectId, ref: 'Paper', required: true },
    commitHash: { type: String, required: true },
    author: String,
    message: String,
    diff: String,
    date: { type: Date, default: Date.now }
});

const Version = mongoose.model('Version', VersionSchema);

module.exports = {
    Paper,
    Dataset,
    Review,
    Version
};
