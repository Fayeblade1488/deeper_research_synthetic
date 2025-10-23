/**
 * @file Project model definition
 * @description Mongoose schema for Project entities
 */

const mongoose = require('mongoose');

/**
 * Project schema
 */
const projectSchema = new mongoose.Schema({
  // Project identification
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true,
    maxlength: [200, 'Project name cannot exceed 200 characters'],
  },
  
  // Framework type
  framework: {
    type: String,
    required: [true, 'Framework type is required'],
    enum: {
      values: ['PROJECT_DEEPDIVE', 'PROJECT_SYNTHETIC', 'PROJECT_BENCHMARK'],
      message: 'Framework must be one of: PROJECT_DEEPDIVE, PROJECT_SYNTHETIC, PROJECT_BENCHMARK',
    },
  },
  
  // Source context for generation
  sourceContext: {
    type: String,
    default: '',
  },
  
  // Generated content
  generatedContent: {
    type: String,
    default: '',
  },
  
  // Generation metadata
  generationMetadata: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  
  // Project status
  status: {
    type: String,
    default: 'New',
    enum: {
      values: ['New', 'In Progress', 'Completed', 'Failed', 'Cancelled'],
      message: 'Status must be one of: New, In Progress, Completed, Failed, Cancelled',
    },
  },
  
  // Version for optimistic locking
  version: {
    type: Number,
    default: 0,
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
  },
  
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  
  // Soft delete
  deletedAt: {
    type: Date,
    default: null,
  },
  
  // User who created the project
  createdBy: {
    type: String,
    default: 'anonymous',
  },
  
  // Tags for categorization
  tags: [{
    type: String,
    trim: true,
  }],
}, {
  // Schema options
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

/**
 * Indexes
 */
projectSchema.index({ createdAt: -1 });
projectSchema.index({ framework: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ name: 'text', sourceContext: 'text' });

/**
 * Middleware
 */

// Update updatedAt before save
projectSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

/**
 * Virtuals
 */

// Virtual for word count
projectSchema.virtual('wordCount').get(function() {
  if (!this.generatedContent) return 0;
  return this.generatedContent.trim().split(/\s+/).filter(word => word.length > 0).length;
});

/**
 * Methods
 */

// Method to mark project as deleted (soft delete)
projectSchema.methods.softDelete = function() {
  this.deletedAt = Date.now();
  return this.save();
};

// Method to check if project is deleted
projectSchema.methods.isDeleted = function() {
  return this.deletedAt !== null;
};

// Method to increment version
projectSchema.methods.incrementVersion = function() {
  this.version += 1;
  return this;
};

/**
 * Statics
 */

// Find all non-deleted projects
projectSchema.statics.findActive = function() {
  return this.find({ deletedAt: null });
};

// Find by ID and ensure it's not deleted
projectSchema.statics.findByIdActive = function(id) {
  return this.findOne({ _id: id, deletedAt: null });
};

/**
 * Model
 */
const Project = mongoose.model('Project', projectSchema);

module.exports = Project;