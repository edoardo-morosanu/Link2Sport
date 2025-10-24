package controllers

import (
	"backend/src/config"
	"backend/src/models"
	"backend/src/types"
	"backend/src/utils"
	"fmt"
	"io"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type PostController struct{}

// ToggleLike toggles like for a post by the authenticated user
func (ec *PostController) ToggleLike(c *gin.Context) {
    userID, exists := c.Get("userID")
    if !exists {
        c.JSON(http.StatusUnauthorized, types.ErrorResponse{
            Error:   "Unauthorized",
            Message: "User not authenticated",
        })
        return
    }

    postID := c.Param("id")
    postIDInt, err := strconv.ParseUint(postID, 10, 32)
    if err != nil {
        c.JSON(http.StatusBadRequest, types.ErrorResponse{
            Error:   "Invalid post ID",
            Message: "Post ID must be a valid number",
        })
        return
    }

    // Ensure post exists
    var post models.Post
    if err := config.DB.Select("id").First(&post, postIDInt).Error; err != nil {
        c.JSON(http.StatusNotFound, types.ErrorResponse{
            Error:   "Post not found",
            Message: "The requested post does not exist",
        })
        return
    }

    uid := userID.(uint)

    // Try to delete existing like; if none deleted, create one
    res := config.DB.Where("post_id = ? AND user_id = ?", post.ID, uid).Delete(&models.PostLike{})
    likedByMe := false
    if res.RowsAffected == 0 {
        like := models.PostLike{PostID: post.ID, UserID: uid}
        if err := config.DB.Create(&like).Error; err != nil {
            c.JSON(http.StatusInternalServerError, types.ErrorResponse{
                Error:   "Database error",
                Message: "Failed to like post",
            })
            return
        }
        likedByMe = true
    }

    // Recount likes
    var likesCount int64
    _ = config.DB.Model(&models.PostLike{}).Where("post_id = ?", post.ID).Count(&likesCount).Error

    c.JSON(http.StatusOK, gin.H{
        "success":      true,
        "likes_count":  likesCount,
        "liked_by_me":  likedByMe,
    })
}

// UpdatePost godoc
// @Summary      Update a post
// @Description  Update an existing post (only by author)
// @Tags         Posts
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id path int true "Post ID"
// @Param        post body types.UpdatePostRequest true "Post update data"
// @Success      200 {object} types.PostResponse "Post updated successfully"
// @Failure      400 {object} types.ErrorResponse "Invalid request data"
// @Failure      401 {object} types.ErrorResponse "User not authenticated"
// @Failure      403 {object} types.ErrorResponse "Not authorized to update this post"
// @Failure      404 {object} types.ErrorResponse "Post not found"
// @Router       /posts/{id} [put]
func (ec *PostController) UpdatePost(c *gin.Context) {
    userID, exists := c.Get("userID")
    if !exists {
        c.JSON(http.StatusUnauthorized, types.ErrorResponse{Error: "Unauthorized", Message: "User not authenticated"})
        return
    }

    postID := c.Param("id")
    postIDInt, err := strconv.ParseUint(postID, 10, 32)
    if err != nil {
        c.JSON(http.StatusBadRequest, types.ErrorResponse{Error: "Invalid post ID", Message: "Post ID must be a valid number"})
        return
    }

    var post models.Post
    if err := config.DB.First(&post, postIDInt).Error; err != nil {
        c.JSON(http.StatusNotFound, types.ErrorResponse{Error: "Post not found", Message: "The requested post does not exist"})
        return
    }

    if post.UserID != userID.(uint) {
        c.JSON(http.StatusForbidden, types.ErrorResponse{Error: "Forbidden", Message: "You can only update your own posts"})
        return
    }

    var req types.UpdatePostRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, types.ErrorResponse{Error: "Invalid request", Message: err.Error()})
        return
    }

    updates := map[string]any{}
    if req.Title != nil { updates["title"] = *req.Title }
    if req.Body != nil { updates["body"] = *req.Body }

    if len(updates) > 0 {
        if err := config.DB.Model(&post).Updates(updates).Error; err != nil {
            c.JSON(http.StatusInternalServerError, types.ErrorResponse{Error: "Database error", Message: "Failed to update post"})
            return
        }
    }

    mentionUsernames := []string{}
    if req.Mentions != nil {
        _ = config.DB.Where("post_id = ?", post.ID).Delete(&models.PostMention{}).Error
        if len(*req.Mentions) > 0 {
            var users []models.User
            if err := config.DB.Where("username IN ?", *req.Mentions).Find(&users).Error; err == nil {
                for _, u := range users {
                    mention := models.PostMention{PostID: post.ID, UserID: u.ID}
                    _ = config.DB.Create(&mention).Error
                    mentionUsernames = append(mentionUsernames, u.Username)
                }
            }
        }
    } else {
        var postMentions []models.PostMention
        _ = config.DB.Preload("User").Where("post_id = ?", post.ID).Find(&postMentions).Error
        for _, m := range postMentions { mentionUsernames = append(mentionUsernames, m.User.Username) }
    }

    if err := config.DB.First(&post, post.ID).Error; err != nil {
        c.JSON(http.StatusInternalServerError, types.ErrorResponse{Error: "Database error", Message: "Failed to reload post"})
        return
    }

    var imageURL *string
    if len(post.ImageData) > 0 { url := fmt.Sprintf("/api/posts/%d/image", post.ID); imageURL = &url }

    var likesCount int64
    _ = config.DB.Model(&models.PostLike{}).Where("post_id = ?", post.ID).Count(&likesCount).Error
    likedByMe := false
    if uid, ok := userID.(uint); ok {
        var cnt int64
        _ = config.DB.Model(&models.PostLike{}).Where("post_id = ? AND user_id = ?", post.ID, uid).Count(&cnt).Error
        likedByMe = cnt > 0
    }

    response := types.PostResponse{ID: post.ID, UserID: post.UserID, Title: post.Title, Body: post.Body, Status: post.Status, ImageURL: imageURL, Mentions: mentionUsernames, LikesCount: int(likesCount), LikedByMe: likedByMe, CreatedAt: post.CreatedAt, UpdatedAt: post.UpdatedAt}
    c.JSON(http.StatusOK, response)
}

// GetPost godoc
// @Summary      Get a post by ID
// @Description  Retrieve a single post by ID
// @Tags         Posts
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id path int true "Post ID"
// @Success      200 {object} types.PostResponse "Post details"
// @Failure      401 {object} types.ErrorResponse "User not authenticated"
// @Failure      404 {object} types.ErrorResponse "Post not found"
// @Router       /posts/{id} [get]
func (ec *PostController) GetPost(c *gin.Context) {
    userID, exists := c.Get("userID")
    if !exists { c.JSON(http.StatusUnauthorized, types.ErrorResponse{Error: "Unauthorized", Message: "User not authenticated"}); return }
    postID := c.Param("id")
    postIDInt, err := strconv.ParseUint(postID, 10, 32)
    if err != nil { c.JSON(http.StatusBadRequest, types.ErrorResponse{Error: "Invalid post ID", Message: "Post ID must be a valid number"}); return }

    var post models.Post
    if err := config.DB.Where("id = ? AND deleted_at IS NULL", postIDInt).First(&post).Error; err != nil {
        c.JSON(http.StatusNotFound, types.ErrorResponse{Error: "Post not found", Message: "The requested post does not exist"})
        return
    }

    var postMentions []models.PostMention
    _ = config.DB.Preload("User").Where("post_id = ?", post.ID).Find(&postMentions).Error
    mentionUsernames := make([]string, 0, len(postMentions))
    for _, m := range postMentions { mentionUsernames = append(mentionUsernames, m.User.Username) }

    var imageURL *string
    if len(post.ImageData) > 0 { url := fmt.Sprintf("/api/posts/%d/image", post.ID); imageURL = &url }

    var likesCount int64
    _ = config.DB.Model(&models.PostLike{}).Where("post_id = ?", post.ID).Count(&likesCount).Error
    likedByMe := false
    if uid, ok := userID.(uint); ok {
        var cnt int64
        _ = config.DB.Model(&models.PostLike{}).Where("post_id = ? AND user_id = ?", post.ID, uid).Count(&cnt).Error
        likedByMe = cnt > 0
    }

    response := types.PostResponse{ID: post.ID, UserID: post.UserID, Title: post.Title, Body: post.Body, Status: post.Status, ImageURL: imageURL, Mentions: mentionUsernames, LikesCount: int(likesCount), LikedByMe: likedByMe, CreatedAt: post.CreatedAt, UpdatedAt: post.UpdatedAt}
    c.JSON(http.StatusOK, response)
}

// GetUserPostsByID returns published posts for a specified user ID
func (ec *PostController) GetUserPostsByID(c *gin.Context) {
    _, exists := c.Get("userID")
    if !exists { c.JSON(http.StatusUnauthorized, types.ErrorResponse{Error: "Unauthorized", Message: "User not authenticated"}); return }
    userParam := c.Param("id")
    uid, err := strconv.ParseUint(userParam, 10, 32)
    if err != nil { c.JSON(http.StatusBadRequest, types.ErrorResponse{Error: "Invalid user ID", Message: "User ID must be a valid number"}); return }

    var posts []models.Post
    if err := config.DB.Where("user_id = ? AND deleted_at IS NULL AND status = ?", uint(uid), types.PostStatusPublished).Order("created_at DESC").Find(&posts).Error; err != nil {
        c.JSON(http.StatusInternalServerError, types.ErrorResponse{Error: "Database error", Message: "Failed to fetch user posts"})
        return
    }

    response := make([]types.PostResponse, 0, len(posts))
    for _, post := range posts {
        var postMentions []models.PostMention
        _ = config.DB.Preload("User").Where("post_id = ?", post.ID).Find(&postMentions).Error
        mentionUsernames := make([]string, 0, len(postMentions))
        for _, m := range postMentions { mentionUsernames = append(mentionUsernames, m.User.Username) }

        var imageURL *string
        if len(post.ImageData) > 0 { url := fmt.Sprintf("/api/posts/%d/image", post.ID); imageURL = &url }

        var likesCount int64
        _ = config.DB.Model(&models.PostLike{}).Where("post_id = ?", post.ID).Count(&likesCount).Error

        response = append(response, types.PostResponse{ID: post.ID, UserID: post.UserID, Title: post.Title, Body: post.Body, Status: post.Status, ImageURL: imageURL, Mentions: mentionUsernames, LikesCount: int(likesCount), LikedByMe: false, CreatedAt: post.CreatedAt, UpdatedAt: post.UpdatedAt})
    }
    c.JSON(http.StatusOK, response)
}

func NewPostController() *PostController { return &PostController{} }

// CreatePost godoc
// @Summary      Create a new post
// @Description  Create a new post
// @Tags         Posts
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        post body types.CreatePostRequest true "Post data"
// @Success      201 {object} types.PostResponse "Post created successfully"
// @Failure      400 {object} types.ErrorResponse "Invalid request data"
// @Failure      401 {object} types.ErrorResponse "User not authenticated"
// @Router       /posts [post]
func (ec *PostController) CreatePost(c *gin.Context) {
    userID, exists := c.Get("userID")
    if !exists {
        c.JSON(http.StatusUnauthorized, types.ErrorResponse{
            Error:   "Unauthorized",
            Message: "User not authenticated",
        })
        return
    }

    var req types.CreatePostRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, types.ErrorResponse{
            Error:   "Invalid request",
            Message: err.Error(),
        })
        return
    }

    post := models.Post{
        UserID: uint(userID.(uint)),
        Title:  req.Title,
        Body:   req.Body,
        Status: types.PostStatusPublished,
    }

    if err := config.DB.Create(&post).Error; err != nil {
        c.JSON(http.StatusInternalServerError, types.ErrorResponse{
            Error:   "Database error",
            Message: "Failed to create post",
        })
        return
    }

    var postMentions []models.PostMention
    if len(req.Mentions) > 0 {
        for _, mention := range req.Mentions {
            var user models.User
            if err := config.DB.Where("username = ?", mention).First(&user).Error; err != nil {
                c.JSON(http.StatusInternalServerError, types.ErrorResponse{
                    Error:   "Database error",
                    Message: "Failed to find mentioned user",
                })
                return
            }

            postMention := models.PostMention{
                PostID: post.ID,
                UserID: user.ID,
            }
            postMentions = append(postMentions, postMention)
        }
    }

    if len(postMentions) > 0 {
        if err := config.DB.Create(&postMentions).Error; err != nil {
            c.JSON(http.StatusInternalServerError, types.ErrorResponse{
                Error:   "Database error",
                Message: "Failed to create post mentions",
            })
            return
        }
    }

    var imageURL *string
    if len(post.ImageData) > 0 {
        url := fmt.Sprintf("/api/posts/%d/image", post.ID)
        imageURL = &url
    }

    response := types.PostResponse{
        ID:        post.ID,
        UserID:    post.UserID,
        Title:     post.Title,
        Body:      post.Body,
        Status:    post.Status,
        ImageURL:  imageURL,
        Mentions:  req.Mentions,
        LikesCount: 0,
        LikedByMe:  false,
        CreatedAt: post.CreatedAt,
        UpdatedAt: post.UpdatedAt,
    }

    c.JSON(http.StatusCreated, response)
}

// GetPosts godoc
// @Summary      Get user's posts
// @Description  Retrieve a list of posts for the authenticated user
// @Tags         Posts
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Success      200 {array} types.PostResponse "List of posts"
// @Failure      401 {object} types.ErrorResponse "User not authenticated"
// @Router       /posts [get]
func (ec *PostController) GetPosts(c *gin.Context) {
    userID, exists := c.Get("userID")
    if !exists {
        c.JSON(http.StatusUnauthorized, types.ErrorResponse{Error: "Unauthorized", Message: "User not authenticated"})
        return
    }

    limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
    offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

    query := config.DB.Preload("Author").Where("deleted_at IS NULL")
    var posts []models.Post
    if err := query.Limit(limit).Offset(offset).Order("created_at DESC").Find(&posts).Error; err != nil {
        c.JSON(http.StatusInternalServerError, types.ErrorResponse{Error: "Database error", Message: "Failed to fetch posts"})
        return
    }

    response := make([]types.PostResponse, 0, len(posts))
    for _, post := range posts {
        var postMentions []models.PostMention
        _ = config.DB.Preload("User").Where("post_id = ?", post.ID).Find(&postMentions).Error
        mentionUsernames := make([]string, 0, len(postMentions))
        for _, m := range postMentions { mentionUsernames = append(mentionUsernames, m.User.Username) }

        var imageURL *string
        if len(post.ImageData) > 0 { url := fmt.Sprintf("/api/posts/%d/image", post.ID); imageURL = &url }

        var likesCount int64
        _ = config.DB.Model(&models.PostLike{}).Where("post_id = ?", post.ID).Count(&likesCount).Error
        likedByMe := false
        if uid, ok := userID.(uint); ok {
            var cnt int64
            _ = config.DB.Model(&models.PostLike{}).Where("post_id = ? AND user_id = ?", post.ID, uid).Count(&cnt).Error
            likedByMe = cnt > 0
        }

        response = append(response, types.PostResponse{ID: post.ID, UserID: post.UserID, Title: post.Title, Body: post.Body, Status: post.Status, ImageURL: imageURL, Mentions: mentionUsernames, LikesCount: int(likesCount), LikedByMe: likedByMe, CreatedAt: post.CreatedAt, UpdatedAt: post.UpdatedAt})
    }
    c.JSON(http.StatusOK, response)
}

// GetUserPosts godoc
// @Summary      Get user's posts
// @Description  Retrieve a list of posts for a specified user ID
// @Tags         Posts
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id path int true "User ID"
// @Success      200 {array} types.PostResponse "List of posts"
// @Failure      401 {object} types.ErrorResponse "User not authenticated"
// @Router       /users/{id}/posts [get]
func (ec *PostController) GetUserPosts(c *gin.Context) {
    userID, exists := c.Get("userID")
    if !exists {
        c.JSON(http.StatusUnauthorized, types.ErrorResponse{Error: "Unauthorized", Message: "User not authenticated"})
        return
    }

    var posts []models.Post
    if err := config.DB.Where("user_id = ? AND deleted_at IS NULL", userID).Order("created_at DESC").Find(&posts).Error; err != nil {
        c.JSON(http.StatusInternalServerError, types.ErrorResponse{Error: "Database error", Message: "Failed to fetch user posts"})
        return
    }

    response := make([]types.PostResponse, 0, len(posts))
    for _, post := range posts {
        var postMentions []models.PostMention
        _ = config.DB.Preload("User").Where("post_id = ?", post.ID).Find(&postMentions).Error
        mentionUsernames := make([]string, 0, len(postMentions))
        for _, m := range postMentions { mentionUsernames = append(mentionUsernames, m.User.Username) }

        var imageURL *string
        if len(post.ImageData) > 0 { url := fmt.Sprintf("/api/posts/%d/image", post.ID); imageURL = &url }

        var likesCount int64
        _ = config.DB.Model(&models.PostLike{}).Where("post_id = ?", post.ID).Count(&likesCount).Error
        likedByMe := false
        if uid, ok := userID.(uint); ok {
            var cnt int64
            _ = config.DB.Model(&models.PostLike{}).Where("post_id = ? AND user_id = ?", post.ID, uid).Count(&cnt).Error
            likedByMe = cnt > 0
        }

        response = append(response, types.PostResponse{ID: post.ID, UserID: post.UserID, Title: post.Title, Body: post.Body, Status: post.Status, ImageURL: imageURL, Mentions: mentionUsernames, LikesCount: int(likesCount), LikedByMe: likedByMe, CreatedAt: post.CreatedAt, UpdatedAt: post.UpdatedAt})
    }
    c.JSON(http.StatusOK, response)
}

// DeletePost godoc
// @Summary      Delete post
// @Description  Delete an existing post (only by author)
// @Tags         Posts
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id path int true "Post ID"
// @Success      204 "Post deleted successfully"
// @Failure      401 {object} types.ErrorResponse "User not authenticated"
// @Failure      403 {object} types.ErrorResponse "Not authorized to delete this post"
// @Failure      404 {object} types.ErrorResponse "Post not found"
// @Router       /posts/{id} [delete]
func (ec *PostController) DeletePost(c *gin.Context) {
    userID, exists := c.Get("userID")
    if !exists {
        c.JSON(http.StatusUnauthorized, types.ErrorResponse{
            Error:   "Unauthorized",
            Message: "User not authenticated",
        })
        return
    }

    postID := c.Param("id")
    postIDInt, err := strconv.ParseUint(postID, 10, 32)
    if err != nil {
        c.JSON(http.StatusBadRequest, types.ErrorResponse{
            Error:   "Invalid post ID",
            Message: "Post ID must be a valid number",
        })
        return
    }

    var post models.Post
    if err := config.DB.First(&post, postIDInt).Error; err != nil {
        c.JSON(http.StatusNotFound, types.ErrorResponse{
            Error:   "Post not found",
            Message: "The requested post does not exist",
        })
        return
    }

    if post.UserID != userID.(uint) {
        c.JSON(http.StatusForbidden, types.ErrorResponse{
            Error:   "Forbidden",
            Message: "You can only delete your own posts",
        })
        return
    }

    if err := config.DB.Delete(&post).Error; err != nil {
        c.JSON(http.StatusInternalServerError, types.ErrorResponse{
            Error:   "Database error",
            Message: "Failed to delete post",
        })
        return
    }

    c.JSON(http.StatusNoContent, gin.H{})
}

// UploadPostImage godoc
// @Summary      Upload post image
// @Description  Upload an image for a post
// @Tags         Posts
// @Accept       multipart/form-data
// @Produce      json
// @Security     BearerAuth
// @Param        id path int true "Post ID"
// @Param        image formData file true "Image file"
// @Success      201 {object} types.PostResponse "Image uploaded successfully"
// @Failure      400 {object} types.ErrorResponse "Invalid request data"
// @Failure      401 {object} types.ErrorResponse "User not authenticated"
// @Failure      403 {object} types.ErrorResponse "Not authorized to update this post"
// @Failure      404 {object} types.ErrorResponse "Post not found"
// @Router       /posts/{id}/image [post]
func (ec *PostController) UploadPostImage(c *gin.Context) {
    userID, exists := c.Get("userID")
    if !exists {
        c.JSON(http.StatusUnauthorized, types.FileUploadError{Error: "Unauthorized", Message: "User not authenticated"})
        return
    }

    postID := c.Param("id")
    postIDInt, err := strconv.ParseUint(postID, 10, 32)
    if err != nil {
        c.JSON(http.StatusBadRequest, types.FileUploadError{Error: "Invalid post ID", Message: "Post ID must be a valid number"})
        return
    }

    var post models.Post
    if err := config.DB.First(&post, postIDInt).Error; err != nil {
        c.JSON(http.StatusNotFound, types.FileUploadError{Error: "Post not found", Message: "Unable to find post"})
        return
    }

    if post.UserID != userID.(uint) {
        c.JSON(http.StatusForbidden, types.FileUploadError{Error: "Forbidden", Message: "You can only update your own posts"})
        return
    }

    fileHeader, err := c.FormFile("image")
    if err != nil {
        c.JSON(http.StatusBadRequest, types.FileUploadError{Error: "No file uploaded", Message: "Please select an image file to upload", ErrorCode: "NO_FILE"})
        return
    }

    if err := utils.ValidateImageFile(fileHeader); err != nil {
        c.JSON(http.StatusBadRequest, types.FileUploadError{Error: "Invalid file", Message: err.Error(), ErrorCode: "INVALID_FILE"})
        return
    }

    file, err := fileHeader.Open()
    if err != nil {
        c.JSON(http.StatusInternalServerError, types.FileUploadError{Error: "File processing failed", Message: "Unable to read uploaded file"})
        return
    }
    defer file.Close()

    fileContent, err := io.ReadAll(file)
    if err != nil {
        c.JSON(http.StatusInternalServerError, types.FileUploadError{Error: "File processing failed", Message: "Unable to process uploaded file"})
        return
    }

    contentType := fileHeader.Header.Get("Content-Type")
    if contentType == "" { contentType = utils.GetContentTypeFromExtension(fileHeader.Filename) }

    updates := map[string]any{"image_data": fileContent, "image_type": contentType}
    if err := config.DB.Model(&post).Updates(updates).Error; err != nil {
        c.JSON(http.StatusInternalServerError, types.FileUploadError{Error: "Database error", Message: "Failed to update post"})
        return
    }

    imageURL := fmt.Sprintf("/api/posts/%d/image", post.ID)
    c.JSON(http.StatusOK, gin.H{"message": "Image uploaded successfully", "success": true, "image_url": imageURL})
}

// GetPostImage godoc
// @Summary      Get post image
// @Description  Retrieve the image for a post
// @Tags         Posts
// @Accept       json
// @Produce      octet-stream
// @Security     BearerAuth
// @Param        id path int true "Post ID"
// @Success      200 {file} string "Post image"
// @Failure      401 {object} types.ErrorResponse "User not authenticated"
// @Failure      404 {object} types.ErrorResponse "Post not found"
// @Router       /posts/{id}/image [get]
func (ec *PostController) GetPostImage(c *gin.Context) {
    _, exists := c.Get("userID")
    if !exists {
        c.JSON(http.StatusUnauthorized, types.ErrorResponse{
            Error:   "Unauthorized",
            Message: "User not authenticated",
        })
        return
    }

    postID := c.Param("id")
    postIDInt, err := strconv.ParseUint(postID, 10, 32)
    if err != nil {
        c.JSON(http.StatusBadRequest, types.ErrorResponse{
            Error:   "Invalid post ID",
            Message: "Post ID must be a valid number",
        })
        return
    }

    var post models.Post
    if err := config.DB.Select("image_data, image_type").First(&post, postIDInt).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "Post not found"})
        return
    }

    if len(post.ImageData) == 0 {
        c.JSON(http.StatusNotFound, gin.H{"error": "No image found"})
        return
    }

    contentType := post.ImageType
    if contentType == "" {
        contentType = "image/jpeg"
    }

    c.Header("Content-Type", contentType)
    c.Header("Cache-Control", "public, max-age=86400")
    c.Data(http.StatusOK, contentType, post.ImageData)
}
