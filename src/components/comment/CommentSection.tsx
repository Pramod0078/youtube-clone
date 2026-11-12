"use client";

import {
  useComments,
  useCreateComment,
  useDeleteComment,
  useLikeComment,
} from "@/features/comment/api/useComments";
import { useAuthStore } from "@/store/useAuthStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDistanceToNow } from "date-fns";
import { useState, useEffect } from "react";
import { Trash2, ThumbsUp, MessageSquare } from "lucide-react";
import { useInView } from "react-intersection-observer";

export function CommentSection({ videoId }: { videoId: string }) {
  const { user } = useAuthStore();
  const { data, fetchNextPage, hasNextPage, status } = useComments(videoId);
  const { mutate: createComment, isPending: isCreating } =
    useCreateComment(videoId);
  const { mutate: deleteComment } = useDeleteComment(videoId);
  const { mutate: likeComment } = useLikeComment(videoId);
  const [content, setContent] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const { ref, inView } = useInView();

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    createComment(
      { content },
      {
        onSuccess: () => setContent(""),
      },
    );
  };

  const handleReplySubmit = (e: React.FormEvent, parentId: string) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    createComment(
      { content: replyContent, parentId },
      {
        onSuccess: () => {
          setReplyContent("");
          setReplyingTo(null);
        },
      },
    );
  };

  const comments = data?.pages.flatMap((p) => p.comments) || [];
  const totalComments = data?.pages[0]?.totalComments || 0;

  return (
    <div className="mt-6 flex flex-col gap-6">
      <h3 className="text-xl font-bold">Comments ({totalComments})</h3>

      {user ? (
        <form onSubmit={handleSubmit} className="flex gap-4">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={user.avatar} />
            <AvatarFallback>
              {user?.username ? user.username.charAt(0).toUpperCase() : "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-2 w-full">
            <Input
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Add a comment..."
              className="border-b-2 border-x-0 border-t-0 rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-primary"
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setContent("")}>
                Cancel
              </Button>
              <Button type="submit" disabled={!content.trim() || isCreating}>
                Comment
              </Button>
            </div>
          </div>
        </form>
      ) : (
        <div className="text-sm text-muted-foreground p-4 bg-muted rounded-lg text-center">
          Please log in to add a comment.
        </div>
      )}

      <div className="flex flex-col gap-4">
        {status === "pending" ? (
          <div className="animate-pulse flex flex-col gap-4">
            <div className="flex gap-4">
              <div className="h-10 w-10 bg-muted rounded-full" />
              <div className="h-10 w-full bg-muted rounded" />
            </div>
          </div>
        ) : comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No comments yet.</p>
        ) : (
          comments.map((comment) => {
            const owner = Array.isArray(comment.owner)
              ? comment.owner[0]
              : comment.owner;
            return (
              <div key={comment._id} className="flex gap-4 group items-start">
                <Avatar className="h-10 w-10 shrink-0 mt-1">
                  <AvatarImage src={owner?.avatar} />
                  <AvatarFallback>
                    {owner?.username?.charAt(0)?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col w-full">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">
                      @{owner?.username}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <p className="text-sm mt-1">{comment.content}</p>

                  <div className="flex items-center gap-4 mt-2">
                    <button
                      onClick={() => likeComment(comment._id)}
                      className={`flex items-center gap-1 text-xs transition-colors ${
                        comment.isLiked
                          ? "text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}>
                      <ThumbsUp
                        className="h-4 w-4"
                        fill={comment.isLiked ? "currentColor" : "none"}
                      />
                      {(Array.isArray(comment.likeCount) ? comment.likeCount[0] : comment.likeCount) > 0 && (
                        <span>{Array.isArray(comment.likeCount) ? comment.likeCount[0] : comment.likeCount}</span>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setReplyingTo(
                          replyingTo === comment._id ? null : comment._id,
                        );
                        setReplyContent("");
                      }}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors font-semibold">
                      Reply
                    </button>
                  </div>

                  {replyingTo === comment._id && (
                    <form
                      onSubmit={(e) => handleReplySubmit(e, comment._id)}
                      className="mt-4 flex gap-3">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src={user?.avatar} />
                        <AvatarFallback>
                          {user?.username
                            ? user.username.charAt(0).toUpperCase()
                            : "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col gap-2 w-full">
                        <Input
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          placeholder="Add a reply..."
                          className="h-8 border-b-2 border-x-0 border-t-0 rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-primary text-sm"
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setReplyingTo(null)}>
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            size="sm"
                            disabled={!replyContent.trim() || isCreating}>
                            Reply
                          </Button>
                        </div>
                      </div>
                    </form>
                  )}

                  {comment.childrenComment &&
                    comment.childrenComment.length > 0 && (
                      <div className="flex flex-col gap-4 mt-4">
                        {comment.childrenComment.map((child: any) => {
                          const childOwner = Array.isArray(child.owner)
                            ? child.owner[0]
                            : child.owner;
                          return (
                            <div
                              key={child._id}
                              className="flex gap-4 group items-start">
                              <Avatar className="h-8 w-8 shrink-0 mt-1">
                                <AvatarImage src={childOwner?.avatar} />
                                <AvatarFallback>
                                  {childOwner?.username
                                    ?.charAt(0)
                                    ?.toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col w-full">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold">
                                    @{childOwner?.username}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(
                                      new Date(child.createdAt),
                                      {
                                        addSuffix: true,
                                      },
                                    )}
                                  </span>
                                </div>
                                <p className="text-sm mt-1">{child.content}</p>
                                <div className="flex items-center gap-4 mt-2">
                                  <button
                                    onClick={() => likeComment(child._id)}
                                    className={`flex items-center gap-1 text-xs transition-colors ${
                                      child.isLiked
                                        ? "text-foreground"
                                        : "text-muted-foreground hover:text-foreground"
                                    }`}>
                                    <ThumbsUp
                                      className="h-4 w-4"
                                      fill={child.isLiked ? "currentColor" : "none"}
                                    />
                                    {(Array.isArray(child.likeCount) ? child.likeCount[0] : child.likeCount) > 0 && (
                                      <span>{Array.isArray(child.likeCount) ? child.likeCount[0] : child.likeCount}</span>
                                    )}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setReplyingTo(
                                        replyingTo === child._id
                                          ? null
                                          : child._id,
                                      );
                                      setReplyContent("");
                                    }}
                                    className="text-xs text-muted-foreground hover:text-foreground transition-colors font-semibold">
                                    Reply
                                  </button>
                                </div>
                                {replyingTo === child._id && (
                                  <form
                                    onSubmit={(e) =>
                                      handleReplySubmit(e, child._id)
                                    }
                                    className="mt-4 flex gap-3">
                                    <Avatar className="h-8 w-8 shrink-0">
                                      <AvatarImage src={user?.avatar} />
                                      <AvatarFallback>
                                        {user?.username
                                          ? user.username
                                              .charAt(0)
                                              .toUpperCase()
                                          : "U"}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col gap-2 w-full">
                                      <Input
                                        value={replyContent}
                                        onChange={(e) =>
                                          setReplyContent(e.target.value)
                                        }
                                        placeholder="Add a reply..."
                                        className="h-8 border-b-2 border-x-0 border-t-0 rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-primary text-sm"
                                      />
                                      <div className="flex justify-end gap-2">
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => setReplyingTo(null)}>
                                          Cancel
                                        </Button>
                                        <Button
                                          type="submit"
                                          size="sm"
                                          disabled={
                                            !replyContent.trim() || isCreating
                                          }>
                                          Reply
                                        </Button>
                                      </div>
                                    </div>
                                  </form>
                                )}

                                {child.childrenComment &&
                                  child.childrenComment.length > 0 && (
                                    <div className="flex flex-col gap-4 mt-4">
                                      {child.childrenComment.map(
                                        (grandchild: any) => {
                                          const grandchildOwner = Array.isArray(
                                            grandchild.owner,
                                          )
                                            ? grandchild.owner[0]
                                            : grandchild.owner;
                                          return (
                                            <div
                                              key={grandchild._id}
                                              className="flex gap-4 group items-start">
                                              <Avatar className="h-8 w-8 shrink-0 mt-1">
                                                <AvatarImage
                                                  src={grandchildOwner?.avatar}
                                                />
                                                <AvatarFallback>
                                                  {grandchildOwner?.username
                                                    ?.charAt(0)
                                                    ?.toUpperCase()}
                                                </AvatarFallback>
                                              </Avatar>
                                              <div className="flex flex-col w-full">
                                                <div className="flex items-center gap-2">
                                                  <span className="text-sm font-semibold">
                                                    @{grandchildOwner?.username}
                                                  </span>
                                                  <span className="text-xs text-muted-foreground">
                                                    {formatDistanceToNow(
                                                      new Date(
                                                        grandchild.createdAt,
                                                      ),
                                                      {
                                                        addSuffix: true,
                                                      },
                                                    )}
                                                  </span>
                                                </div>
                                                <p className="text-sm mt-1">
                                                  {grandchild.content}
                                                </p>
                                                <div className="flex items-center gap-4 mt-2">
                                                  <button
                                                    onClick={() =>
                                                      likeComment(
                                                        grandchild._id,
                                                      )
                                                    }
                                                    className={`flex items-center gap-1 text-xs transition-colors ${
                                                      grandchild.isLiked
                                                        ? "text-foreground"
                                                        : "text-muted-foreground hover:text-foreground"
                                                    }`}>
                                                    <ThumbsUp
                                                      className="h-4 w-4"
                                                      fill={grandchild.isLiked ? "currentColor" : "none"}
                                                    />
                                                    {(Array.isArray(grandchild.likeCount) ? grandchild.likeCount[0] : grandchild.likeCount) > 0 && (
                                                      <span>{Array.isArray(grandchild.likeCount) ? grandchild.likeCount[0] : grandchild.likeCount}</span>
                                                    )}
                                                  </button>
                                                </div>
                                              </div>
                                              {user?._id ===
                                                grandchildOwner?._id && (
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                  onClick={() =>
                                                    deleteComment(
                                                      grandchild._id,
                                                    )
                                                  }>
                                                  <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                              )}
                                            </div>
                                          );
                                        },
                                      )}
                                    </div>
                                  )}
                              </div>
                              {user?._id === childOwner?._id && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => deleteComment(child._id)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                </div>
                {user?._id === owner?._id && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => deleteComment(comment._id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            );
          })
        )}

        {hasNextPage && (
          <div ref={ref} className="w-full flex justify-center py-4">
            <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
