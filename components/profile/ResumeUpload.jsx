"use client";

import React, { useRef, useState } from "react";
import Card, { CardHeader, CardTitle, CardContent } from "../ui/Card";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import { FileText, Upload, RefreshCw, Trash2, CheckCircle2 } from "lucide-react";

export default function ResumeUpload({ resumeUrl, onUpload, onRemove, saving }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploading(true);
      try {
        await onUpload(file);
      } finally {
        setUploading(false);
      }
    }
  };

  return (
    <Card className="bg-white border-[#E2E2E5]">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Resume / CV</span>
          {resumeUrl && (
            <Badge variant="success" size="sm" icon={CheckCircle2}>
              Uploaded
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {resumeUrl ? (
          <div className="p-4 rounded-xl bg-[#F5F5F6] border border-[#E2E2E5] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-[#F1EBFF] text-[#40189D]">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#222222] truncate max-w-xs">
                  {resumeUrl}
                </p>
                <p className="text-xs text-[#6F6F73]">
                  PDF Document • Ready for auto-fill
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={RefreshCw}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                Replace
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon={Trash2}
                onClick={onRemove}
                className="text-red-700 hover:bg-red-50"
              >
                Remove
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-8 border-2 border-dashed border-[#E2E2E5] rounded-2xl text-center flex flex-col items-center bg-[#F5F5F6]/50">
            <div className="p-4 rounded-2xl bg-[#F1EBFF] text-[#40189D] mb-3">
              <Upload className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-[#222222]">
              Upload your Resume (PDF)
            </h4>
            <p className="text-xs text-[#6F6F73] mt-1 mb-4 max-w-xs">
              Saarthi automatically uses your resume to pre-fill application forms on external job sites.
            </p>
            <Button
              variant="primary"
              size="md"
              icon={Upload}
              isLoading={uploading || saving}
              onClick={() => fileInputRef.current?.click()}
              className="bg-[#40189D] hover:bg-[#32127A]"
            >
              Select PDF File
            </Button>
          </div>
        )}

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          className="hidden"
          aria-label="Upload Resume PDF"
        />
      </CardContent>
    </Card>
  );
}
