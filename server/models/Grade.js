const mongoose = require('mongoose');

const { Schema } = mongoose;

const gradeSchema = Schema({
  grade: { type: Number, required: true },
  _lesson: { type: Schema.Types.ObjectId, ref: 'Lesson' },
  _student: { type: Schema.Types.ObjectId, ref: 'Student' }
});

const Grade = mongoose.model('Grade', gradeSchema);
module.exports = Grade;
