import React, { useState } from 'react';
import { 
    View, 
    Text, 
    Modal, 
    StyleSheet, 
    TextInput, 
    TouchableOpacity,
    TouchableWithoutFeedback,
    Keyboard,
    Platform
} from 'react-native';
import { Rating } from 'react-native-ratings';
import { useDispatch } from 'react-redux';
import { createProductReview } from '../../Context/Actions/productActions';

const ReviewModal = ({ visible, onClose, productId }) => {
    const dispatch = useDispatch();
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');

    const handleSubmit = async () => {
        if (rating === 0) {
            alert('Please select a rating');
            return;
        }
        if (comment.trim().length < 5) {
            alert('Please write a comment (minimum 5 characters)');
            return;
        }

        try {
            await dispatch(createProductReview(productId, { rating, comment }));
            onClose();
            // Reset form
            setRating(0);
            setComment('');
        } catch (error) {
            alert(error.message);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.title}>Write a Review</Text>
                        
                        <Rating
                            showRating
                            onFinishRating={setRating}
                            style={styles.rating}
                            startingValue={rating}
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Write your review here..."
                            value={comment}
                            onChangeText={setComment}
                            multiline
                            numberOfLines={4}
                        />

                        <View style={styles.buttonContainer}>
                            <TouchableOpacity 
                                style={[styles.button, styles.cancelButton]}
                                onPress={onClose}
                            >
                                <Text style={styles.buttonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.button, styles.submitButton]}
                                onPress={handleSubmit}
                            >
                                <Text style={styles.buttonText}>Submit</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        width: '90%',
        maxWidth: 500,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    rating: {
        paddingVertical: 10,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 5,
        padding: 10,
        marginVertical: 10,
        minHeight: 100,
        textAlignVertical: 'top',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    button: {
        flex: 1,
        padding: 12,
        borderRadius: 5,
        marginHorizontal: 5,
    },
    cancelButton: {
        backgroundColor: '#666',
    },
    submitButton: {
        backgroundColor: '#4CAF50',
    },
    buttonText: {
        color: 'white',
        textAlign: 'center',
        fontWeight: 'bold',
    },
});

export default ReviewModal;
