
import { Eye, Clock, CheckCircle, XCircle, Upload } from "lucide-react";

interface VideoIdea {
  status: string;
  approval_status: string;
}

interface StatusDisplay {
  text: string;
  color: string;
  icon: JSX.Element;
}

export const getStatusDisplay = (idea: VideoIdea): StatusDisplay => {
  const { status, approval_status } = idea;
  
  if (approval_status === 'preview_ready') {
    return {
      text: 'Preview Ready',
      color: 'bg-blue-100 text-blue-800',
      icon: <Eye className="w-3 h-3" />
    };
  }
  
  if (approval_status === 'approved' && status === 'publishing') {
    return {
      text: 'Publishing...',
      color: 'bg-yellow-100 text-yellow-800',
      icon: <Upload className="w-3 h-3" />
    };
  }
  
  if (approval_status === 'approved' && status === 'completed') {
    return {
      text: 'Published',
      color: 'bg-green-100 text-green-800',
      icon: <CheckCircle className="w-3 h-3" />
    };
  }
  
  if (approval_status === 'rejected') {
    return {
      text: 'Rejected',
      color: 'bg-red-100 text-red-800',
      icon: <XCircle className="w-3 h-3" />
    };
  }

  // Default status mapping for older entries or edge cases
  switch (status) {
    case 'completed':
      return {
        text: 'Completed',
        color: 'bg-green-100 text-green-800',
        icon: <CheckCircle className="w-3 h-3" />
      };
    case 'processing':
      return {
        text: 'Generating...',
        color: 'bg-yellow-100 text-yellow-800',
        icon: <Clock className="w-3 h-3" />
      };
    case 'failed':
      return {
        text: 'Failed',
        color: 'bg-red-100 text-red-800',
        icon: <XCircle className="w-3 h-3" />
      };
    default:
      return {
        text: 'Pending',
        color: 'bg-gray-100 text-gray-800',
        icon: <Clock className="w-3 h-3" />
      };
  }
};

interface VideoIdeaStatusBadgeProps {
  idea: VideoIdea;
}

export const VideoIdeaStatusBadge = ({ idea }: VideoIdeaStatusBadgeProps) => {
  const statusDisplay = getStatusDisplay(idea);
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusDisplay.color}`}>
      {statusDisplay.icon}
      {statusDisplay.text}
    </span>
  );
};
