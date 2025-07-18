import User from '../models/User.js'
import Message from '../models/Message.js'
import cloudinary from '../libs/cloudinary.js'
import { io, userSocketMap } from '../socketStore.js';


export const getUsersForSideBar = async (req, res) => {
    try {
        const userId = req.user._id;
        const filteredUsers = await User.find({ _id: { $ne: userId } }).select('-password');
        const unseenMessage = {}
        const promises = filteredUsers.map(async (user) => {
            const message = await Message.find({ senderId: user._id, receiverId: userId, seen: false })
            if (message.length > 0) {
                unseenMessage[user._id] = message.length;
            }
            return null
        })
        await Promise.all(promises);
        res.json({ success: true, user: filteredUsers, unseenMessage })
    } catch (error) {
        console.error("Error fetching users:", error.message);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
}

export const getMessages = async (req, res) => {
    try {
        const { id: selectedUserId } = req.params
        const myId = req.user._id

        const message = await Message.find({
            $or: [
                { senderId: myId, receiverId: selectedUserId },
                { senderId: selectedUserId, receiverId: myId }


            ]
        })
        await Message.updateMany({ senderId: selectedUserId, receiverId: myId }, { seen: true })
        res.json({ success: true, message })
    } catch (error) {
    
        console.error("Error fetching messages:", error.message);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
}

export const markMessageAsSeen = async (req, res) => {
    try{
        const {id}=req.params;
        await Message.findByIdAndUpdate(id,{seen:true})
        res.json({success:true})
    }catch(error){
           console.error("Error fetching messages:", error.message);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
}

export const sendMessage = async (req, res) => {
    try{
        const {text,image}= req.body;
        const receiverId=req.params.id;
        const senderId= req.user._id;

        let imageUrl;
        if (image){
            const uploadResponse=await cloudinary.uploader.upload(image)
            imageUrl= uploadResponse.secure_url
        }
        const newMessage = await Message.create({
            senderId,
            receiverId,
            text,
            image:imageUrl
        }) 


        const receiverSocketId=userSocketMap[receiverId]
        if (receiverSocketId){
            io.to(receiverSocketId).emit("newMessage", newMessage)
        }




        res.json({success:true , newMessage})

    }catch(error){
        console.log(error.message)
        res.json({success:false, message: error.message})
    }
} 