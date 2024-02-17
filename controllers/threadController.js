const mongoose = require("mongoose");
const Thread = require("../models/thread");
const { sendMail } = require("./SendMail");
const user = require("../models/usermodel");
const dotenv = require("dotenv");
dotenv.config();
const getThread = async (req, res) => {
  const sortOption = req.query.sort || "newest";
  const searchTerm = req.query.search || "";
  const heading = req.query.heading || "";
  const userThreads = req.query.userThread || "all";
  try {
    let query = Thread.find();

    if (searchTerm) {
      query = Thread.find({
        $or: [
          { title: { $regex: searchTerm, $options: "i" } },
          { content: { $regex: searchTerm, $options: "i" } },
          { highlightedContent: { $regex: searchTerm, $options: "i" } },
        ],
      });
    }

    if (heading && heading !== "All") {
      query = query.where({ heading: heading });
    }
    if (userThreads === "admin") {
      query = query.where({ authorIsAdmin: true });
    } else if (userThreads !== "all") {
      query = query.where({ authorIdentity: userThreads });
    }

    if (sortOption === "newest") {
      query = query.sort({ _id: -1 });
    } else if (sortOption === "oldest") {
      query = query.sort({ _id: 1 });
    } else if (sortOption === "mostViews") {
      query = query.sort({ views: -1 });
    }

    const threads = await query.exec();

    res.json(threads);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const getDetailedThread = async (req, res) => {
  try {
    const threadId = req.params.threadId;
    const thread = await Thread.findOne({ _id: threadId });

    if (!thread) {
      return res.status(404).json({ message: "Thread not found" });
    }
    res.json(thread);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
const deleteThread = async (req, res) => {
  const threadId = req.params.threadId;
  const { isAdmin, userName } = req.body;

  try {
    // Assuming you have a user authentication middleware that provides the user information
    // and the user role is stored in req.user.role
    const thread = await Thread.findById(threadId);

    if (!thread) {
      return res.status(404).json({ message: "Thread not found." });
    }
    if (isAdmin || thread.author === userName) {
      // Admin user can delete any thread, and the author can delete their own thread
      await Thread.findByIdAndDelete(threadId);
      return res.status(200).json({ message: "Thread deleted successfully." });
    } else {
      return res.status(403).json({
        message: "Permission denied. You can only delete your own threads.",
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

const postThread = async (req, res) => {
  const { title, content, highlightedContent, userId, heading, thumbnail } =
    req.body;
  // Check if a thread with the same title already exists
  const existingThread = await Thread.findOne({ title });
  const Author = await user.findOne({ _id: userId });
  if (existingThread) {
    // If a thread with the same title exists, return a 400 Bad Request status
    return res
      .status(400)
      .json({ error: "Thread with the same title already exists." });
  }

  // If no existing thread, create a new thread
  const newThread = new Thread({
    author: Author.userName,
    authorIsAdmin: Author.isAdmin,
    authorIdentity: Author.userIdentity,
    authorProfilePic: Author.profilePic,
    title: title,
    content: content,
    highlightedContent: highlightedContent,
    heading: heading,
    thumbnail: thumbnail,
  });
  try {
    await newThread.save();
    res.json(newThread);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const editThread = async (req, res) => {
  try {
    const { threadId } = req.params;
    const { title, highlightedContent, heading, content, thumbnail } = req.body;
    if (title) {
      const updatedThread = await Thread.findByIdAndUpdate(
        threadId,
        { title },
        { new: true } // Return the updated thread
      );
    }
    let updatedThread = {};
    if (highlightedContent) {
      updatedThread = await Thread.findByIdAndUpdate(
        threadId,
        { highlightedContent },
        { new: true } // Return the updated thread
      );
    }
    if (heading) {
      updatedThread = await Thread.findByIdAndUpdate(
        threadId,
        { heading },
        { new: true } // Return the updated thread
      );
    }
    if (thumbnail) {
      updatedThread = await Thread.findByIdAndUpdate(
        threadId,
        { thumbnail },
        { new: true } // Return the updated thread
      );
    }
    if (content) {
      updatedThread = await Thread.findByIdAndUpdate(
        threadId,
        { content },
        { new: true } // Return the updated thread
      );
    }
    res.json(updatedThread);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};
const viewCountThread = async (req, res) => {
  try {
    const thread = await Thread.findById(req.params.id);

    if (!thread) {
      return res.status(404).json({ message: "Thread not found" });
    }

    // Increment view count
    thread.views += 1;

    // Save the thread with the updated view count
    await thread.save();

    res.status(200).json({ views: thread.views });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
const likeThread = async (req, res) => {
  const threadId = req.params.id;
  const userId = req.body.userId; // Assuming you have user authentication middleware
  const User = await user.findById({ _id: userId });
  try {
    const thread = await Thread.findById(threadId);

    if (!thread) {
      return res.status(404).json({ error: "Thread not found" });
    }
    const authorData = await user.findOne({
      userIdentity: thread.authorIdentity,
    });
    // Check if userId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid userId" });
    }

    // Check if the user has already liked the thread
    const isLiked = thread.likedBy.includes(userId);

    if (isLiked) {
      // Unlike the thread
      thread.likes -= 1;
      thread.likedBy = thread.likedBy.filter((id) => id.toString() !== userId);
      const url = `${process.env.frontUrl}/${thread._id}`;
      const content = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Mention Notification</title>
    <style>
      .notification-container {
        font-family: sans-serif;
        max-width: 100%;
        margin: 0 auto;
      }

      .notification-content {
        margin-bottom: 20px;
      }

      .button-link {
        display: inline-block;
        padding: 10px 20px;
        font-size: 16px;
        background-color: #f01f1f;
        color: #fff;
        border-radius: 5px;
        text-decoration: none;
        border: none;
        cursor: pointer;
      }

      .button-link:hover {
        background-color: #6af071;
      }

      .logo-container {
        margin-top: 20px;
      }

      .logo-container img {
        width: 100px; /* Adjust the size as needed */
        height: auto;
      }
    </style>
  </head>
  <body>
    <div class="notification-container">
      <div class="notification-content">
        <p><strong>${User.userName}</strong> has liked your thread:</p>
        <p>${thread.title}</p>
      </div>
      <a href="${url}" class="button-link">Click here to see</a>
      <div class="logo-container">
        <img
          src="	https://revnitro.com/images/Group%2026.png"
          alt="RevNitro Logo"
        />
        <p>Team RevNitro</p>
      </div>
    </div>
  </body>
</html>`;
      sendMail(authorData.email, "liked", content);
      let notifname = "";
        if(thread.author === User.userName){
          notifname = "You Yourself";
        } else{
           notifname = User.userName ;
        }
      authorData.notifications.push({
        threadId: thread._id,
        senderProfilePic: User.profilePic,
        senderId: User.userId,
        message: `<strong>${notifname}</strong> has viewed your post and liked your post: <span style={{color:#2200FF}}>"${thread.title}"</span>. click here to view the post...`,
      });
      await authorData.save();
    } else {
      // Like the thread
      thread.likes += 1;
      thread.likedBy.push(userId);
    }

    await thread.save();
    res.json({ likes: thread.likes, likedBy: thread.likedBy });
  } catch (error) {
    console.error("Error handling like:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
const postComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text, userId, mentionedUserIdentities } = req.body;
    const User = await user.findById({ _id: userId });
    // Input validation
    if (!id || !text || !userId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Retrieve thread and author details
    const thread = await Thread.findById(id);
    const author = await user.findById(userId);

    if (!thread || !author) {
      return res.status(404).json({ error: "Thread or author not found" });
    }
    //const mentionedUserIdentities = text.match(/@([a-zA-Z0-9_]+)/g) || [];
    // Add a new comment to the thread
    thread.comments.push({
      text: text,
      commenterName: author.userName,
      commenterIsAdmin: author.isAdmin,
      commenterIdentity: author.userIdentity,
      commenterProfilePic:
        author.profilePic.length > 1 ? author.profilePic : "",
    });

    // Save the thread with the new comment
    await thread.save();
    mentionedUserIdentities.forEach(async (mentionedUserIdentity) => {
      const mentionedUser = await user.findOne({
        userIdentity: mentionedUserIdentity,
      });
      const url = `${process.env.frontUrl}/${thread._id}`;
      const content = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Mention Notification</title>
    <style>
      .notification-container {
        font-family: sans-serif;
        max-width: 100%;
        margin: 0 auto;
      }

      .notification-content {
        margin-bottom: 20px;
      }

      .button-link {
        display: inline-block;
        padding: 10px 20px;
        font-size: 16px;
        background-color: #f01f1f;
        color: #fff;
        border-radius: 5px;
        text-decoration: none;
        border: none;
        cursor: pointer;
      }

      .button-link:hover {
        background-color: #6af071;
      }

      .logo-container {
        margin-top: 20px;
      }

      .logo-container img {
        width: 100px; /* Adjust the size as needed */
        height: auto;
      }
    </style>
  </head>
  <body>
    <div class="notification-container">
      <div class="notification-content">
        <p>${author.userName} has mentioned you in a thread:</p>
        <p>${thread.title}</p>
      </div>
      <a href="${url}" class="button-link">Click here to see</a>
      <div class="logo-container">
        <img
          src="	https://revnitro.com/images/Group%2026.png"
          alt="RevNitro Logo"
        />
        <p>Team RevNitro</p>
      </div>
    </div>
  </body>
</html>`;
      if (mentionedUser && mentionedUser.email) {
        // Use an email library or service to send the notification
        sendMail(mentionedUser.email, "mentioned", content);
      }
      if (mentionedUser) {
        let notifname = "";
        if(mentionedUser.userName === User.userName){
          notifname = "You Yourself";
        } else{
           notifname = User.userName ;
        }
        
        mentionedUser.notifications.push({
          threadId: thread._id,
          senderProfilePic: author.profilePic,
          senderId: userId,
          message: `<strong>${notifname}</strong> has mentioned you in a post'c comment : <span style={{color:#2200FF}}>"${thread.title}"</span>. click here to view the post...`,
        });
        await mentionedUser.save();
      }
    });
    res.json(thread); // Send the updated thread as the response
  } catch (error) {
    console.error(error);

    // Handle specific errors
    if (error.name === "ValidationError") {
      return res.status(400).json({ error: "Validation Error" });
    }

    res.status(500).json({ error: "Internal Server Error" });
  }
};

const deleteComment = async (req, res) => {
  const { threadId, commentId } = req.params;

  try {
    const updatedThread = await Thread.findByIdAndUpdate(
      threadId,
      { $pull: { comments: { _id: commentId } } },
      { new: true }
    );
    if (!updatedThread) {
      return res.status(404).json({ message: "Thread not found" });
    }
    res.json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
const myThreads = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { currentUser } = req.body;
    // Check if the authenticated user matches the requested user
    if (userId !== currentUser) {
      return res.status(403).json({ error: "Unauthorized access" });
    }
    const User = await user.findById({ _id: userId });
    //const username = User.userName;
    const userThreads = await Thread.find({
      author: User.userName,
    }).sort({
      createdAt: -1,
    });
    res.json(userThreads);
  } catch (error) {
    console.error("Error fetching user threads:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const mention = async (req, res) => {
  try {
    // Assuming you have a User model
    const users = await user.find();
    const userProfiles = users.map((user) => ({
      userIdentity: user.userIdentity,
      userPic: user.profilePic,
    }));
    res.json(userProfiles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
module.exports = {
  getThread,
  postThread,
  postComment,
  getDetailedThread,
  deleteThread,
  editThread,
  viewCountThread,
  likeThread,
  deleteComment,
  myThreads,
  mention,
};
