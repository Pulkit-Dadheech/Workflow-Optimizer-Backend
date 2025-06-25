const mongoose = require('mongoose');
const { Schema } = mongoose;

const userDataSchema = new mongoose.Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  recommendations: { type: [Schema.Types.Mixed], default: [] },
  insights: {
    process: { type: [String], default: [] },
    user: { type: [String], default: [] },
    activity: { type: [String], default: [] }
  },
  commonPaths: { type: [Schema.Types.Mixed], default: [] },
  stepDurations: { type: [Schema.Types.Mixed], default: [] },
  caseDurations: { type: Schema.Types.Mixed, default: {} },
  slaViolations: { type: [Schema.Types.Mixed], default: [] },
  userDelays: { type: Schema.Types.Mixed, default: {} },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('UserData', userDataSchema);
