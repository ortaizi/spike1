'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  FileArchive,
  FileCode,
  FileImage,
  FileText,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';

interface AssignmentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: {
    title: string;
    course: string;
    due_date: string;
    days_left: number;
  };
}

interface UploadedFile {
  id: string;
  name: string;
  size: string;
  type: string;
  status: 'uploading' | 'success' | 'error';
  progress?: number;
}

export function AssignmentUploadModal({ isOpen, onClose, assignment }: AssignmentUploadModalProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newFiles: UploadedFile[] = Array.from(files).map((file, index) => ({
      id: `file-${Date.now()}-${index}`,
      name: file.name,
      size: formatFileSize(file.size),
      type: getFileType(file.name),
      status: 'uploading' as const,
      progress: 0,
    }));

    setUploadedFiles((prev) => [...prev, ...newFiles]);

    // Simulate upload progress
    newFiles.forEach((file, index) => {
      const interval = setInterval(() => {
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === file.id ? { ...f, progress: Math.min((f.progress || 0) + 20, 100) } : f
          )
        );
      }, 200);

      setTimeout(
        () => {
          clearInterval(interval);
          setUploadedFiles((prev) =>
            prev.map((f) =>
              f.id === file.id ? { ...f, status: 'success' as const, progress: 100 } : f
            )
          );
        },
        1000 + index * 500
      );
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileType = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'PDF';
      case 'doc':
      case 'docx':
        return 'Word';
      case 'xls':
      case 'xlsx':
        return 'Excel';
      case 'ppt':
      case 'pptx':
        return 'PowerPoint';
      case 'jpg':
      case 'jpeg':
      case 'png':
        return 'Image';
      case 'zip':
      case 'rar':
        return 'Archive';
      case 'py':
      case 'js':
      case 'ts':
      case 'java':
        return 'Code';
      default:
        return 'File';
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'PDF':
        return <FileText className='h-5 w-5 text-red-500' />;
      case 'Word':
        return <FileText className='h-5 w-5 text-blue-500' />;
      case 'Excel':
        return <FileText className='h-5 w-5 text-green-500' />;
      case 'PowerPoint':
        return <FileText className='h-5 w-5 text-orange-500' />;
      case 'Image':
        return <FileImage className='h-5 w-5 text-purple-500' />;
      case 'Archive':
        return <FileArchive className='h-5 w-5 text-gray-500' />;
      case 'Code':
        return <FileCode className='h-5 w-5 text-indigo-500' />;
      default:
        return <FileText className='h-5 w-5 text-gray-500' />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className='h-4 w-4 text-green-500' />;
      case 'error':
        return <AlertCircle className='h-4 w-4 text-red-500' />;
      case 'uploading':
        return <Clock className='h-4 w-4 animate-spin text-blue-500' />;
      default:
        return null;
    }
  };

  const handleUpload = () => {
    // Simulate upload completion
    console.log('Uploading files for assignment:', assignment.title);
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm'
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className='max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900'
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className='flex items-center justify-between border-b border-slate-200 p-6 dark:border-slate-700'>
              <div>
                <h2 className='text-xl font-bold text-slate-900 dark:text-white'>הגשת מטלה</h2>
                <p className='mt-1 text-sm text-slate-600 dark:text-slate-400'>
                  {assignment.title} - {assignment.course}
                </p>
              </div>
              <button
                onClick={onClose}
                className='rounded-lg p-2 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800'
              >
                <X className='h-5 w-5 text-slate-500' />
              </button>
            </div>

            {/* Content */}
            <div className='space-y-6 p-6'>
              {/* Upload Area */}
              <div
                className={cn(
                  'rounded-xl border-2 border-dashed p-8 text-center transition-all',
                  isDragging
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-slate-300 hover:border-slate-400 dark:border-slate-600 dark:hover:border-slate-500'
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload className='mx-auto mb-4 h-12 w-12 text-slate-400' />
                <h3 className='mb-2 text-lg font-semibold text-slate-900 dark:text-white'>
                  בחר קובץ פתרון מהמחשב שלך
                </h3>
                <p className='mb-4 text-sm text-slate-600 dark:text-slate-400'>
                  גרור קבצים לכאן או לחץ לבחירה
                </p>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className='bg-blue-600 text-white hover:bg-blue-700'
                >
                  בחר קובץ
                </Button>
                <input
                  ref={fileInputRef}
                  type='file'
                  multiple
                  className='hidden'
                  onChange={(e) => handleFileSelect(e.target.files)}
                  accept='.pdf,.doc,.docx,.txt,.zip,.rar,.jpg,.jpeg,.png'
                />
              </div>

              {/* File Restrictions */}
              <div className='rounded-lg bg-slate-50 p-4 dark:bg-slate-800'>
                <div className='flex items-center space-x-2 space-x-reverse text-sm text-slate-600 dark:text-slate-400'>
                  <AlertCircle className='h-4 w-4' />
                  <span>רק קבצי .pdf, .doc, .docx, .txt, .zip, .rar, .jpg, .jpeg, .png</span>
                </div>
                <div className='mt-1 flex items-center space-x-2 space-x-reverse text-sm text-slate-600 dark:text-slate-400'>
                  <AlertCircle className='h-4 w-4' />
                  <span>גודל מקסימלי: 20MB לקובץ</span>
                </div>
              </div>

              {/* Uploaded Files List */}
              {uploadedFiles.length > 0 && (
                <div className='space-y-3'>
                  <h4 className='font-semibold text-slate-900 dark:text-white'>קבצים שהועלו:</h4>
                  <div className='max-h-48 space-y-2 overflow-y-auto'>
                    {uploadedFiles.map((file) => (
                      <div
                        key={file.id}
                        className='flex items-center justify-between rounded-lg bg-slate-50 p-3 dark:bg-slate-800'
                      >
                        <div className='flex items-center space-x-3 space-x-reverse'>
                          {getFileIcon(file.type)}
                          <div>
                            <p className='text-sm font-medium text-slate-900 dark:text-white'>
                              {file.name}
                            </p>
                            <p className='text-xs text-slate-500 dark:text-slate-400'>
                              {file.size} • {file.type}
                            </p>
                          </div>
                        </div>
                        <div className='flex items-center space-x-2 space-x-reverse'>
                          {getStatusIcon(file.status)}
                          {file.status === 'uploading' && file.progress && (
                            <div className='h-2 w-16 rounded-full bg-slate-200 dark:bg-slate-700'>
                              <div
                                className='h-2 rounded-full bg-blue-500 transition-all'
                                style={{ width: `${file.progress}%` }}
                              />
                            </div>
                          )}
                          <button
                            onClick={() => removeFile(file.id)}
                            className='p-1 text-slate-400 transition-colors hover:text-red-500'
                          >
                            <Trash2 className='h-4 w-4' />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className='flex items-center justify-end space-x-3 space-x-reverse border-t border-slate-200 p-6 dark:border-slate-700'>
              <Button
                variant='outline'
                onClick={onClose}
                className='border-slate-300 dark:border-slate-600'
              >
                ביטול
              </Button>
              <Button
                onClick={handleUpload}
                disabled={uploadedFiles.length === 0}
                className='bg-blue-600 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50'
              >
                העלה מטלה
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
