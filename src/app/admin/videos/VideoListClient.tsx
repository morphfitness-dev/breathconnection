"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import UploadModal from "./UploadModal";

type MuxStatus = "PENDING" | "PROCESSING" | "READY" | "ERRORED";

interface VideoRow {
  id: string;
  title: string;
  exerciseCode: string | null;
  muxStatus: MuxStatus;
  isPublished: boolean;
  uploadedAt: Date;
  muxPlaybackId: string | null;
  exercise: { code: string } | null;
}

interface VideoListClientProps {
  initialVideos: VideoRow[];
}

const statusBadge: Record<MuxStatus, { label: string; className: string }> = {
  PENDING: { label: "Pending", className: "bg-gray-100 text-gray-600" },
  PROCESSING: { label: "Processing", className: "bg-yellow-100 text-yellow-700" },
  READY: { label: "Ready", className: "bg-green-100 text-green-700" },
  ERRORED: { label: "Errored", className: "bg-red-100 text-red-700" },
};

export default function VideoListClient({ initialVideos }: VideoListClientProps) {
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  const handleUploadComplete = () => {
    router.refresh();
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1C1C1A]">Videos</h1>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 text-sm font-medium bg-[#1D9E75] text-white rounded-lg hover:bg-[#085041] transition-colors"
        >
          Upload new video
        </button>
      </div>

      {initialVideos.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500 text-sm">No videos yet. Upload your first video to get started.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Title</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Exercise</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Published</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Uploaded</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {initialVideos.map((video) => {
                const badge = statusBadge[video.muxStatus];
                return (
                  <tr key={video.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-[#1C1C1A]">{video.title}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {video.exercise?.code ?? video.exerciseCode ?? (
                        <span className="text-gray-300 italic">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          video.isPublished
                            ? "bg-[#E1F5EE] text-[#085041]"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {video.isPublished ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(video.uploadedAt).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <UploadModal
          onClose={() => setShowModal(false)}
          onComplete={handleUploadComplete}
        />
      )}
    </>
  );
}
