"use client";

import React from "react";

import { FileUploadView } from "@/components/file-manager/FileUploadView";
import { useUpload } from "@/hooks/use-upload";

export default function FileUpload(): React.JSX.Element {
  const uploadState = useUpload();

  return (
    <FileUploadView {...uploadState} />
  );
}
