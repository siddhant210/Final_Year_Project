import React, { useState, useRef, useEffect } from 'react';
import { FileText, Image, Upload, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { motion } from 'framer-motion';
import supabase from '../../supabaseClient';
import useAuth from '../../hooks/useAuth';

interface Document {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'pdf';
  created_at: string;
}

export default function Documents() {
  const { session } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Fetch documents from Supabase storage
  useEffect(() => {
    const fetchDocuments = async () => {
      if (!session?.user?.id) return;

      try {
        setLoading(true);
        
        // Get list of files from storage
        const { data: files, error } = await supabase
          .storage
          .from('documents')
          .list(session.user.id);

        if (error) throw error;

        // Get public URLs for each file
        const docs = await Promise.all(
          files.map(async (file) => {
            const { data: urlData } = supabase
              .storage
              .from('documents')
              .getPublicUrl(`${session.user.id}/${file.name}`);

            return {
              id: file.id,
              name: file.name,
              url: urlData.publicUrl,
              type: file.name.endsWith('.pdf') ? 'pdf' : 'image',
              created_at: file.created_at
            };
          })
        );

        setDocuments(docs);
      } catch (error) {
        console.error('Error fetching documents:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [session]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !session?.user?.id) return;

    const file = e.target.files[0];
    const fileType = file.type.includes('pdf') ? 'pdf' : 'image';
    const filePath = `${session.user.id}/${file.name}`;

    try {
      setUploading(true);
      
      // Upload file to Supabase storage
      const { error } = await supabase
        .storage
        .from('documents')
        .upload(filePath, file, { upsert: true });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase
        .storage
        .from('documents')
        .getPublicUrl(filePath);

      // Add to local state
      setDocuments(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          name: file.name,
          url: urlData.publicUrl,
          type: fileType,
          created_at: new Date().toISOString()
        }
      ]);
    } catch (error) {
      console.error('Error uploading document:', error);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (docId: string, docName: string) => {
    if (!session?.user?.id) return;

    try {
      // Delete from storage
      const { error } = await supabase
        .storage
        .from('documents')
        .remove([`${session.user.id}/${docName}`]);

      if (error) throw error;

      // Remove from local state
      setDocuments(prev => prev.filter(doc => doc.id !== docId));
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  const toggleExpand = (docId: string) => {
    setExpandedDoc(expandedDoc === docId ? null : docId);
  };

  const openPreview = (url: string) => {
    setPreviewUrl(url);
  };

  const closePreview = () => {
    setPreviewUrl(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Documents</h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {uploading ? (
                <span className="animate-pulse">Uploading...</span>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  <span>Upload Document</span>
                </>
              )}
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleUpload}
              accept="image/*,.pdf"
              className="hidden"
            />
          </div>
        </div>

        {/* Documents Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-12 h-12 text-gray-500 dark:text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">No documents yet</h3>
            <p className="mt-1 text-gray-500 dark:text-gray-400">
              Upload your first document by clicking the button above
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map((doc) => (
              <motion.div
                key={doc.id}
                whileHover={{ y: -2 }}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/30 dark:border-gray-700/30 overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {doc.type === 'pdf' ? (
                        <FileText className="w-6 h-6 text-red-500" />
                      ) : (
                        <Image className="w-6 h-6 text-blue-500" />
                      )}
                      <span className="font-medium truncate max-w-[180px]">{doc.name}</span>
                    </div>
                    <button
                      onClick={() => toggleExpand(doc.id)}
                      className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      {expandedDoc === doc.id ? <ChevronUp /> : <ChevronDown />}
                    </button>
                  </div>

                  {expandedDoc === doc.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 space-y-3"
                    >
                      <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                        <span>Type: {doc.type.toUpperCase()}</span>
                        <span>
                          {new Date(doc.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openPreview(doc.url)}
                          className="flex-1 bg-blue-100 dark:bg-blue-900/50 hover:bg-blue-200 dark:hover:bg-blue-800 text-blue-600 dark:text-blue-400 py-2 rounded-lg transition-colors"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDelete(doc.id, doc.name)}
                          className="flex-1 bg-red-100 dark:bg-red-900/50 hover:bg-red-200 dark:hover:bg-red-800 text-red-600 dark:text-red-400 py-2 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5 mx-auto" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Preview Modal */}
        {previewUrl && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="relative bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
              <button
                onClick={closePreview}
                className="absolute top-4 right-4 bg-gray-200 dark:bg-gray-700 rounded-full p-2 z-10"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              {previewUrl.endsWith('.pdf') ? (
                <iframe
                  src={previewUrl}
                  className="w-full h-[80vh]"
                  title="PDF Preview"
                />
              ) : (
                <img
                  src={previewUrl}
                  alt="Document Preview"
                  className="w-full h-auto max-h-[80vh] object-contain"
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}