/**
 * User roles and their permissions
 */
const ROLES = {
  STUDENT: 'student',
  TRAINER: 'trainer',
  COORDINATOR: 'coordinator'
};

// Define base permissions for each role
const studentPermissions = [
  'view_own_profile',
  'update_own_profile',
  'view_own_placements',
  'apply_for_jobs'
];

const trainerPermissions = [
  ...studentPermissions,
  'view_student_profiles',
  'evaluate_students',
  'view_own_evaluations'
];

const coordinatorPermissions = [
  ...trainerPermissions,
  'manage_trainers',
  'manage_job_postings',
  'view_all_placements',
  'generate_reports',
  'manage_system_settings'
];

const PERMISSIONS = {
  [ROLES.STUDENT]: studentPermissions,
  [ROLES.TRAINER]: trainerPermissions,
  [ROLES.COORDINATOR]: coordinatorPermissions
};

module.exports = {
  ROLES,
  PERMISSIONS
};
