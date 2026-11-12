import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/axios";
import { Comment } from "@/types";
import { toast } from "sonner";

export const getComments = async (videoId: string, offset = 0): Promise<{ comments: Comment[], totalComments: number }> => {
  const limit = 10;
  const { data } = await api.get(`/videoComments/parent-comment/${videoId}`, {
    params: { offset, limit },
  });
  
  let comments: Comment[] = [];
  if (Array.isArray(data.data)) {
    comments = data.data;
  } else {
    comments = data.data?.comments || data.data?.docs || [];
  }
  
  return { comments, totalComments: data.data?.totalComments || 0 };
};

export const useComments = (videoId: string) => {
  const limit = 10;
  return useInfiniteQuery({
    queryKey: ["comments", videoId],
    queryFn: ({ pageParam = 0 }) => getComments(videoId, pageParam as number),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages, lastPageParam) => {
      if (lastPage.comments.length === limit) {
        return (lastPageParam as number) + limit;
      }
      return undefined;
    },
    enabled: !!videoId,
  });
};

export const useCreateComment = (videoId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ content, parentId }: { content: string, parentId?: string }) => {
      const { data } = await api.post(`/videoComments/comment/${videoId}`, { content, parentId });
      return data.data;
    },
    onSuccess: () => {
      toast.success("Comment added");
      queryClient.invalidateQueries({ queryKey: ["comments", videoId] });
    },
  });
};

export const useDeleteComment = (videoId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (commentId: string) => {
      await api.post(`/videoComments/delete-comment/${commentId}`);
    },
    onSuccess: () => {
      toast.success("Comment deleted");
      queryClient.invalidateQueries({ queryKey: ["comments", videoId] });
    },
  });
};

export const useLikeComment = (videoId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (commentId: string) => {
      const { data } = await api.post(`/videoComments/comment-like`, { commentId, videoId });
      return data.data;
    },
    onSuccess: () => {
      toast.success("Comment liked");
      queryClient.invalidateQueries({ queryKey: ["comments", videoId] });
    },
  });
};
