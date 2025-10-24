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
            Message: "You can only update your own posts",
        })
        return
    }

    var req types.UpdatePostRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, types.ErrorResponse{
            Error:   "Invalid request",
            Message: err.Error(),
        })
        return
    }

    updates := map[string]any{}
    if req.Title != nil {
        updates["title"] = *req.Title
    }
    if req.Body != nil {
        updates["body"] = *req.Body
    }

    if len(updates) > 0 {
        if err := config.DB.Model(&post).Updates(updates).Error; err != nil {
            c.JSON(http.StatusInternalServerError, types.ErrorResponse{
                Error:   "Database error",
                Message: "Failed to update post",
            })
            return
        }
    }

    // Update mentions if provided
    mentionUsernames := []string{}
    if req.Mentions != nil {
        // Clear existing mentions
        _ = config.DB.Where("post_id = ?", post.ID).Delete(&models.PostMention{}).Error

        // Map usernames to users and recreate mentions
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
        // If mentions weren't updated, return the current list
        var postMentions []models.PostMention
        _ = config.DB.Preload("User").Where("post_id = ?", post.ID).Find(&postMentions).Error
        for _, m := range postMentions {
            mentionUsernames = append(mentionUsernames, m.User.Username)
        }
    }

    // Refresh post
    if err := config.DB.First(&post, post.ID).Error; err != nil {
        c.JSON(http.StatusInternalServerError, types.ErrorResponse{
            Error:   "Database error",
            Message: "Failed to reload post",
        })
        return
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
        Mentions:  mentionUsernames,
        CreatedAt: post.CreatedAt,
        UpdatedAt: post.UpdatedAt,
    }

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
    if err := config.DB.Where("id = ? AND deleted_at IS NULL", postIDInt).First(&post).Error; err != nil {
        c.JSON(http.StatusNotFound, types.ErrorResponse{
            Error:   "Post not found",
            Message: "The requested post does not exist",
        })
        return
    }

    // Fetch mentions
    var postMentions []models.PostMention
    _ = config.DB.Preload("User").Where("post_id = ?", post.ID).Find(&postMentions).Error
    mentionUsernames := make([]string, 0, len(postMentions))
    for _, m := range postMentions {
        mentionUsernames = append(mentionUsernames, m.User.Username)
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
        Mentions:  mentionUsernames,
        CreatedAt: post.CreatedAt,
        UpdatedAt: post.UpdatedAt,
    }

    c.JSON(http.StatusOK, response)
}
// GetUserPostsByID returns published posts for a specified user ID
func (ec *PostController) GetUserPostsByID(c *gin.Context) {
	_, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{
			Error:   "Unauthorized",
			Message: "User not authenticated",
		})
		return
	}

	userParam := c.Param("id")
	uid, err := strconv.ParseUint(userParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid user ID",
			Message: "User ID must be a valid number",
		})
		return
	}

	var posts []models.Post
	if err := config.DB.Where("user_id = ? AND deleted_at IS NULL AND status = ?", uint(uid), types.PostStatusPublished).
		Order("created_at DESC").Find(&posts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Error:   "Database error",
			Message: "Failed to fetch user posts",
		})
		return
	}

	response := make([]types.PostResponse, 0, len(posts))
	for _, post := range posts {
		var postMentions []models.PostMention
		_ = config.DB.Preload("User").Where("post_id = ?", post.ID).Find(&postMentions).Error
		mentionUsernames := make([]string, 0, len(postMentions))
		for _, m := range postMentions {
			mentionUsernames = append(mentionUsernames, m.User.Username)
		}

		var imageURL *string
		if len(post.ImageData) > 0 {
			url := fmt.Sprintf("/api/posts/%d/image", post.ID)
			imageURL = &url
		}

		response = append(response, types.PostResponse{
			ID:        post.ID,
			UserID:    post.UserID,
			Title:     post.Title,
			Body:      post.Body,
			Status:    post.Status,
			ImageURL:  imageURL,
			Mentions:  mentionUsernames,
			CreatedAt: post.CreatedAt,
			UpdatedAt: post.UpdatedAt,
		})
	}

	c.JSON(http.StatusOK, response)
}

func NewPostController() *PostController {
	return &PostController{}
}

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
		UserID: userID.(uint),
		Title:  req.Title,
		Body:   req.Body,
		Status: types.PostStatusPublished,
	}

	if err := config.DB.Create(&post).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Error:   "Database error",
			Message: "Failed to create Post",
		})
		return
	}

	// Handle mentions if provided
	mentions := []string{}
	if len(req.Mentions) > 0 {
		var users []models.User
		if err := config.DB.Where("username IN ?", req.Mentions).Find(&users).Error; err == nil {
			for _, u := range users {
				mention := models.PostMention{PostID: post.ID, UserID: u.ID}
				_ = config.DB.Create(&mention).Error
				mentions = append(mentions, u.Username)
			}
		}
	}

	response := types.PostResponse{
		ID:        post.ID,
		UserID:    post.UserID,
		Title:     post.Title,
		Body:      post.Body,
		Status:    post.Status,
		Mentions:  mentions,
		CreatedAt: post.CreatedAt,
		UpdatedAt: post.UpdatedAt,
	}

	c.JSON(http.StatusCreated, response)
}

// GetPosts godoc
// @Summary      Get all posts
// @Description  Retrieve all posts
// @Tags         Posts
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        limit query int false "Limit number of results" default(20)
// @Param        offset query int false "Offset for pagination" default(0)
// @Success      200 {array} types.PostResponse "List of posts"
// @Failure      401 {object} types.ErrorResponse "User not authenticated"
// @Router       /posts [get]
func (ec *PostController) GetPosts(c *gin.Context) {
	_, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{
			Error:   "Unauthorized",
			Message: "User not authenticated",
		})
		return
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	query := config.DB.Preload("Author").Where("deleted_at IS NULL")

	var posts []models.Post
	if err := query.Limit(limit).Offset(offset).Order("created_at DESC").Find(&posts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Error:   "Database error",
			Message: "Failed to fetch posts",
		})
		return
	}

	response := make([]types.PostResponse, 0)
	for _, post := range posts {
		// Fetch mentions for this post
		var postMentions []models.PostMention
		_ = config.DB.Preload("User").Where("post_id = ?", post.ID).Find(&postMentions).Error
		mentionUsernames := make([]string, 0, len(postMentions))
		for _, m := range postMentions {
			mentionUsernames = append(mentionUsernames, m.User.Username)
		}

		var imageURL *string
		if len(post.ImageData) > 0 {
			url := fmt.Sprintf("/api/posts/%d/image", post.ID)
			imageURL = &url
		}

		postResponse := types.PostResponse{
			ID:        post.ID,
			UserID:    post.UserID,
			Title:     post.Title,
			Body:      post.Body,
			Status:    post.Status,
			ImageURL:  imageURL,
			Mentions:  mentionUsernames,
			CreatedAt: post.CreatedAt,
			UpdatedAt: post.UpdatedAt,
		}

		response = append(response, postResponse)
	}

	c.JSON(http.StatusOK, response)
}

// GetUserPosts godoc
// @Summary      Get user's posts
// @Description  Retrieve posts created by the authenticated user
// @Tags         Posts
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Success      200 {array} types.PostResponse "List of user's posts"
// @Failure      401 {object} types.ErrorResponse "User not authenticated"
// @Router       /posts/my [get]
func (ec *PostController) GetUserPosts(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{
			Error:   "Unauthorized",
			Message: "User not authenticated",
		})
		return
	}

	var posts []models.Post
	if err := config.DB.Where("user_id = ? AND deleted_at IS NULL", userID).Order("created_at DESC").Find(&posts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Error:   "Database error",
			Message: "Failed to fetch user posts",
		})
		return
	}

	response := make([]types.PostResponse, 0)
	for _, post := range posts {
		// Fetch mentions for this post
		var postMentions []models.PostMention
		_ = config.DB.Preload("User").Where("post_id = ?", post.ID).Find(&postMentions).Error
		mentionUsernames := make([]string, 0, len(postMentions))
		for _, m := range postMentions {
			mentionUsernames = append(mentionUsernames, m.User.Username)
		}

		var imageURL *string
		if len(post.ImageData) > 0 {
			url := fmt.Sprintf("/api/posts/%d/image", post.ID)
			imageURL = &url
		}

		postResponse := types.PostResponse{
			ID:        post.ID,
			UserID:    post.UserID,
			Title:     post.Title,
			Body:      post.Body,
			Status:    post.Status,
			ImageURL:  imageURL,
			Mentions:  mentionUsernames,
			CreatedAt: post.CreatedAt,
			UpdatedAt: post.UpdatedAt,
		}

		response = append(response, postResponse)
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

	// Mark as deleted and soft delete
	post.Status = types.PostStatusDeleted
	if err := config.DB.Save(&post).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Error:   "Database error",
			Message: "Failed to update post",
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

	c.JSON(http.StatusNoContent, nil)
}

// UploadPostImage godoc
// @Summary      Upload post image
// @Description  Upload an image for a post (only by author). Accepts JPEG, PNG, WebP up to 5MB.
// @Tags         Posts
// @Accept       multipart/form-data
// @Produce      json
// @Security     BearerAuth
// @Param        id path int true "Post ID"
// @Param        image formData file true "Post image file (JPEG, PNG, WebP, max 5MB)"
// @Success      200 {object} map[string]any "Image uploaded successfully"
// @Failure      400 {object} types.FileUploadError "No file uploaded or invalid file format"
// @Failure      401 {object} types.FileUploadError "User not authenticated"
// @Failure      403 {object} types.FileUploadError "Not authorized"
// @Failure      404 {object} types.FileUploadError "Post not found"
// @Failure      500 {object} types.FileUploadError "File processing or database error"
// @Router       /posts/{id}/image [post]
func (ec *PostController) UploadPostImage(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, types.FileUploadError{
			Error:   "Unauthorized",
			Message: "User not authenticated",
		})
		return
	}

	postID := c.Param("id")
	postIDInt, err := strconv.ParseUint(postID, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, types.FileUploadError{
			Error:   "Invalid post ID",
			Message: "Post ID must be a valid number",
		})
		return
	}

	var post models.Post
	if err := config.DB.First(&post, postIDInt).Error; err != nil {
		c.JSON(http.StatusNotFound, types.FileUploadError{
			Error:   "Post not found",
			Message: "Unable to find post",
		})
		return
	}

	if post.UserID != userID.(uint) {
		c.JSON(http.StatusForbidden, types.FileUploadError{
			Error:   "Forbidden",
			Message: "You can only update your own posts",
		})
		return
	}

	fileHeader, err := c.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, types.FileUploadError{
			Error:     "No file uploaded",
			Message:   "Please select an image file to upload",
			ErrorCode: "NO_FILE",
		})
		return
	}

	if err := utils.ValidateImageFile(fileHeader); err != nil {
		c.JSON(http.StatusBadRequest, types.FileUploadError{
			Error:     "Invalid file",
			Message:   err.Error(),
			ErrorCode: "INVALID_FILE",
		})
		return
	}

	file, err := fileHeader.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, types.FileUploadError{
			Error:   "File processing failed",
			Message: "Unable to read uploaded file",
		})
		return
	}
	defer file.Close()

	fileContent, err := io.ReadAll(file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, types.FileUploadError{
			Error:   "File processing failed",
			Message: "Unable to process uploaded file",
		})
		return
	}

	contentType := fileHeader.Header.Get("Content-Type")
	if contentType == "" {
		contentType = utils.GetContentTypeFromExtension(fileHeader.Filename)
	}

	updates := map[string]any{
		"image_data": fileContent,
		"image_type": contentType,
	}

	if err := config.DB.Model(&post).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.FileUploadError{
			Error:   "Database error",
			Message: "Failed to update post",
		})
		return
	}

	imageURL := fmt.Sprintf("/api/posts/%d/image", post.ID)
	c.JSON(http.StatusOK, gin.H{
		"message":   "Image uploaded successfully",
		"success":   true,
		"image_url": imageURL,
	})
}

// GetPostImage godoc
// @Summary      Get post image
// @Description  Retrieve a post's image by post ID
// @Tags         Posts
// @Accept       json
// @Produce      image/jpeg,image/png,image/webp
// @Param        id path int true "Post ID"
// @Success      200 {string} binary "Post image"
// @Failure      404 {object} object{error=string} "No image found"
// @Router       /posts/{id}/image [get]
func (ec *PostController) GetPostImage(c *gin.Context) {
	postID := c.Param("id")
	postIDInt, err := strconv.ParseUint(postID, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid post ID"})
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
