# Spec Delta

## Purpose

Allow editors to select and upload images without exposing provider credentials or crossing site and organization boundaries.

## ADDED Requirements

### Requirement: Image URL selection
A media_picker SHALL accept HTTPS image URLs and safe site-relative image paths, show a preview and an unavailable-image state, and preserve the selected string in content. Relative previews SHALL resolve against the selected site's HTTPS origin. Unsafe schemes, protocol-relative paths, traversal, and embedded credentials SHALL be rejected.

#### Scenario: Existing site image
- **WHEN** an editor selects img/profile/profile.jpg for a site
- **THEN** its preview uses that site's origin and the stored value remains img/profile/profile.jpg

### Requirement: Provider-backed uploads
The system SHALL support S3, Cloudinary, and R2 upload adapters selected through trusted per-site configuration. With no configured provider, URL entry SHALL remain usable and uploads SHALL show an explanatory disabled state. Uploaded images SHALL become selectable only after validation and successful completion.

#### Scenario: Configured providers
- **WHEN** an authorized editor uploads a valid image to a site configured for S3, Cloudinary, or R2
- **THEN** the corresponding adapter stores the image under that site's namespace and returns a durable image URL

#### Scenario: Upload failure
- **WHEN** an upload fails or its completion cannot be verified
- **THEN** the current field value remains unchanged and the editor can retry

### Requirement: Scoped upload authorization
Upload initiation and completion SHALL verify organization/site ownership and content:write permission. Provider secrets SHALL remain server-side; temporary upload grants SHALL be constrained to a server-generated site-scoped object key and expire. A grant or uploaded object from another site SHALL NOT be accepted.

#### Scenario: Cross-site upload completion
- **WHEN** a caller submits an object key or upload grant belonging to another site
- **THEN** completion fails without attaching the image or disclosing provider credentials

### Requirement: File validation and lifecycle boundaries
Uploads SHALL allow JPEG, PNG, WebP, and GIF up to 10 MiB, verify actual bytes and size, and reject SVG, executable files, or mismatched file types. Removing a field value, cancelling an editor, or deleting an entry SHALL NOT delete shared provider assets automatically.

#### Scenario: Reject disguised or oversized files
- **WHEN** a file exceeds 10 MiB or its verified type differs from its claimed supported type
- **THEN** upload completion rejects it and no URL is attached to content

#### Scenario: Cancel after uploading
- **WHEN** an editor uploads an image and cancels the unsaved form
- **THEN** persisted content remains unchanged and the uploaded asset is not automatically deleted
