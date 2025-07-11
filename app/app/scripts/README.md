# File Hash Viewer

This script provides a visual interface to view file names and their SHA-256 hashes side by side.

## Components

### FileHashViewer Component (`file_hash_viewer.tsx`)
- Displays files and their hashes in a clean table format
- Calculates SHA-256 hashes for file contents
- Provides copy functionality for hashes
- Shows full file paths and shortened hash previews

### View Page (`view-file-hashes.tsx`)
- Example implementation showing how to use the FileHashViewer
- Contains the file content from the provided CONTENT parameter

## Features

- **File Display**: Shows file names with full paths
- **Hash Calculation**: Computes SHA-256 hashes for each file's content
- **Copy Functionality**: Easy copy buttons for full hash values
- **Visual Design**: Green-themed terminal-style interface matching the app's design
- **Responsive Layout**: Clean table layout with hover effects

## Usage

1. Import the FileHashViewer component
2. Pass a Record<string, string> object where:
   - Keys are file paths
   - Values are file contents
3. The component will automatically calculate and display hashes

## Example

```tsx
import FileHashViewer from './file_hash_viewer'

const files = {
  '/path/to/file1.ts': 'file content here',
  '/path/to/file2.tsx': 'another file content'
}

export default function MyPage() {
  return <FileHashViewer files={files} />
}
```