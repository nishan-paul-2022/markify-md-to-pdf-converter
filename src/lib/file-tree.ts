import type { AppFile } from '@/hooks/use-files';

export interface FileTreeNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: FileTreeNode[];
  file?: AppFile;
  path: string;
  batchId?: string;
}

export function buildFileTree(files: AppFile[]): FileTreeNode[] {
  // Group files by batchId first to ensure complete separation
  const batchGroups = new Map<string, AppFile[]>();

  files.forEach((file) => {
    const batchId = file.batchId || 'no-batch';
    const group = batchGroups.get(batchId) || [];
    if (!batchGroups.has(batchId)) {
      batchGroups.set(batchId, group);
    }
    group.push(file);
  });

  const root: FileTreeNode[] = [];

  // Process each batch separately to ensure they never merge
  batchGroups.forEach((batchFiles, batchId) => {
    batchFiles.forEach((file) => {
      const fullPath = file.relativePath || file.originalName;
      const parts = fullPath.split('/');
      let currentLevel = root;
      let accumulatedPath = '';

      parts.forEach((part, index) => {
        const isLast = index === parts.length - 1;
        accumulatedPath = accumulatedPath ? `${accumulatedPath}/${part}` : part;

        // CRITICAL: Use batchId in the folder key to ensure folders from different uploads never merge
        // Even if they have the same name (e.g., two uploads both named "content-1")
        const nodeKey = isLast ? file.id : `folder-${batchId}-${accumulatedPath}`;

        let node = currentLevel.find((n) => n.id === nodeKey);

        if (!node) {
          node = {
            id: nodeKey,
            name: part,
            type: isLast ? 'file' : 'folder',
            path: accumulatedPath,
            children: isLast ? undefined : [],
            file: isLast ? file : undefined,
            batchId: batchId,
          };
          currentLevel.push(node);
        }

        if (node.children) {
          currentLevel = node.children;
        }
      });
    });
  });

  // Sort: folders first, then alphabetically
  const sortNodes = (nodes: FileTreeNode[]) => {
    nodes.sort((a, b) => {
      // Priority sorting:
      // 1. Default items (sample-document, sample-project)
      // 2. Folders
      // 3. Alphabetical

      const isDefaultA = a.batchId === 'sample-document' || a.batchId === 'sample-project';
      const isDefaultB = b.batchId === 'sample-document' || b.batchId === 'sample-project';

      if (isDefaultA && !isDefaultB) {
        return -1;
      }
      if (!isDefaultA && isDefaultB) {
        return 1;
      }

      // If both are defaults, sample-document goes before sample-project (or vice versa, but let's keep it consistent)
      if (isDefaultA && isDefaultB) {
        if (a.batchId === 'sample-document' && b.batchId === 'sample-project') {
          return -1;
        }
        if (a.batchId === 'sample-project' && b.batchId === 'sample-document') {
          return 1;
        }
      }

      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
    nodes.forEach((node) => {
      if (node.children) {
        sortNodes(node.children);
      }
    });
  };

  sortNodes(root);
  return root;
}
