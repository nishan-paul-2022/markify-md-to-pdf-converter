import { File } from "@/hooks/use-files";

export interface FileTreeNode {
  id: string;
  name: string;
  type: "file" | "folder";
  children?: FileTreeNode[];
  file?: File;
  path: string;
}

export function buildFileTree(files: File[]): FileTreeNode[] {
  const root: FileTreeNode[] = [];

  files.forEach((file) => {
    const path = file.relativePath || file.originalName;
    const parts = path.split("/");
    let currentLevel = root;

    parts.forEach((part, index) => {
      const isLast = index === parts.length - 1;
      const currentPath = parts.slice(0, index + 1).join("/");
      
      let node = currentLevel.find((n) => n.name === part);

      if (!node) {
        node = {
          id: isLast ? file.id : `folder-${currentPath}`,
          name: part,
          type: isLast ? "file" : "folder",
          path: currentPath,
          children: isLast ? undefined : [],
          file: isLast ? file : undefined,
        };
        currentLevel.push(node);
      }

      if (node.children) {
        currentLevel = node.children;
      }
    });
  });

  // Sort: folders first, then alphabetically
  const sortNodes = (nodes: FileTreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === "folder" ? -1 : 1;
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
