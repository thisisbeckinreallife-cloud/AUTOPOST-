import type { TranslationKey } from "./es";

export const en: Record<TranslationKey, string> = {
  // Nav
  "nav.home": "Home",
  "nav.accounts": "My accounts",
  "nav.settings": "Settings",
  "nav.help": "Help",
  "nav.logout": "Log out",

  // Dashboard
  "dashboard.hello": "Hello!",
  "dashboard.summary": "Here's a summary of your posts",
  "dashboard.getStarted": "Let's get started",
  "dashboard.getStartedDesc": "Follow these steps to schedule your first posts",
  "dashboard.upcoming": "Upcoming",
  "dashboard.publishedToday": "Published today",
  "dashboard.withErrors": "With errors",
  "dashboard.uploadContent": "Upload content",
  "dashboard.uploadZip": "Upload a ZIP with your monthly posts",
  "dashboard.upcomingPosts": "Upcoming posts",
  "dashboard.emptyTitle": "Your calendar is empty",
  "dashboard.emptyDesc": "Upload your monthly content and AutoPost will publish for you",

  // Businesses
  "businesses.title": "My accounts",
  "businesses.subtitle": "The Instagram accounts you manage",
  "businesses.add": "Add account",
  "businesses.emptyTitle": "Your account list is empty",
  "businesses.emptyDesc": "Connect your first Instagram account and start scheduling posts",
  "businesses.posts": "posts",
  "businesses.notConnected": "Not connected — tap to connect",

  // New business
  "newBusiness.title": "New account",
  "newBusiness.subtitle": "Add a new Instagram account",
  "newBusiness.name": "Name",
  "newBusiness.slug": "Slug",
  "newBusiness.timezone": "Timezone",
  "newBusiness.description": "Description",
  "newBusiness.create": "Create account",
  "newBusiness.cancel": "Cancel",

  // Business detail
  "business.connected": "Instagram connected",
  "business.notConnected": "Instagram not connected",
  "business.notConnectedDesc": "Connect your account to start publishing automatically",
  "business.reconnect": "Reconnect",
  "business.connect": "Connect",
  "business.scheduled": "Scheduled",
  "business.published": "Published",
  "business.errors": "With errors",
  "business.upload": "Upload content",
  "business.uploadZip": "Upload the monthly ZIP",
  "business.viewPosts": "View posts",
  "business.managePosts": "Manage your posts",
  "business.recentUploads": "Recently uploaded content",
  "business.viewAll": "View all",

  // Batches
  "batches.title": "Uploads",
  "batches.uploadZip": "Upload ZIP",
  "batches.emptyTitle": "No content uploaded yet",
  "batches.emptyDesc": "Upload a ZIP file with your posts organized in folders",
  "batches.validPosts": "valid",
  "batches.errors": "errors",

  // Batch detail
  "batch.analyzing": "Analyzing your content...",
  "batch.analyzingDesc": "This may take a few seconds. The page will update automatically.",
  "batch.postsFound": "Posts found",
  "batch.readyToPublish": "Ready to publish",
  "batch.withProblems": "With problems",
  "batch.activateTitle": "All set? Activate your posts",
  "batch.activate": "Activate",
  "batch.problems": "problem",
  "batch.problems_plural": "problems",
  "batch.fixAndReupload": "Fix these issues in your folder and re-upload the ZIP",
  "batch.warnings": "warning",
  "batch.warnings_plural": "warnings",
  "batch.warningsNote": "(not errors)",
  "batch.yourPosts": "Your posts",

  // Posts
  "posts.title": "Posts",
  "posts.all": "All",

  // Post detail
  "post.notFound": "Post not found.",
  "post.retry": "Retry",
  "post.cancel": "Cancel",
  "post.publishedOnIG": "Published on Instagram",
  "post.viewPost": "View post",
  "post.details": "Post details",
  "post.scheduledFor": "Scheduled for",
  "post.type": "Type",
  "post.media": "Media",
  "post.files": "files",
  "post.file": "file",
  "post.attempts": "Attempts",
  "post.publishedAt": "Published",
  "post.caption": "Caption",
  "post.mediaFiles": "Media files",
  "post.publishHistory": "Publish history",
  "post.attempt": "Attempt",

  // Connect
  "connect.title": "Connect your Instagram",
  "connect.step": "Step",
  "connect.of": "of",
  "connect.professionalAccount": "Do you have a professional Instagram account?",
  "connect.professionalDesc": "Instagram has two types of accounts. AutoPost requires a professional one (business or creator).",
  "connect.personal": "Personal",
  "connect.notCompatible": "Not compatible",
  "connect.professional": "Professional",
  "connect.businessOrCreator": "Business or Creator",
  "connect.hasProfessional": "Yes, I have a professional account",
  "connect.facebookPage": "Do you have a linked Facebook page?",
  "connect.facebookDesc": "Professional Instagram needs to be connected to a Facebook page for automatic publishing.",
  "connect.authorize": "Authorize AutoPost",
  "connect.authorizeDesc": "Click the button below. A Facebook/Instagram window will open where you must accept the permissions.",
  "connect.connectIG": "Connect my Instagram",
  "connect.back": "Back",

  // Login
  "login.welcome": "Welcome",
  "login.subtitle": "Sign in to continue",
  "login.email": "Email",
  "login.password": "Password",
  "login.submit": "Sign in",

  // Logs
  "logs.title": "Activity log",
  "logs.entries": "entries",
  "logs.all": "All",
  "logs.noResults": "No logs found.",
  "logs.time": "Time",
  "logs.action": "Action",
  "logs.business": "Account",
  "logs.entity": "Entity",

  // 404
  "notFound.title": "Page not found",
  "notFound.desc": "The page you're looking for doesn't exist or has been moved.",
  "notFound.goHome": "Go to Dashboard",

  // Common
  "common.loading": "Loading...",
  "common.networkError": "Network error. Check your connection.",
  "common.poweredBy": "Powered by AutoPost",
};
