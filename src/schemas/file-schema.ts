import { z } from 'zod';

export const GroupMemberSchema = z.object({
  name: z.string(),
  roll: z.string(),
});

export const MetadataSchema = z.object({
  university: z.string().optional(),
  program: z.string().optional(),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  course: z.string().optional(),
  name: z.string().optional(),
  roll: z.string().optional(),
  reg: z.string().optional(),
  batch: z.string().optional(),
  date: z.string().optional(),
  groupMembers: z.array(GroupMemberSchema).optional(),
});

export const FileRenameSchema = z.object({
  id: z.string(),
  newName: z.string().min(1, 'New name is required'),
  type: z.enum(['file', 'folder']),
  batchId: z.string().optional(),
  oldPath: z.string().optional(),
});

export const BulkDeleteSchema = z.object({
  ids: z.array(z.string()).min(1, 'No IDs provided'),
});

export const FileUploadSchema = z.object({
  batchId: z.string().optional(),
  relativePath: z.string().optional(),
  source: z.enum(['editor', 'converter']).default('editor'),
});

export type Metadata = z.infer<typeof MetadataSchema>;
export type GroupMember = z.infer<typeof GroupMemberSchema>;
