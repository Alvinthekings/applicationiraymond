import React, { useState } from 'react';
import { Alert, Dimensions, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ImageViewing from 'react-native-image-viewing';
import Icon from 'react-native-vector-icons/FontAwesome';


const screenWidth = Dimensions.get('window').width;


type Post = {
  id: number;
  user: string;
  caption: string;
  images: any[];
  date: string;
};


type PostCardProps = {
  post: Post;
};


export default function PostCard({ post }: PostCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isViewerVisible, setIsViewerVisible] = useState(false);
  const [liked, setLiked] = useState(false);


  const handleViewImage = (index: number) => {
    setCurrentImageIndex(index);
    setIsViewerVisible(true);
  };


  const handleLike = () => {
    setLiked(!liked);
  };


  const handleComment = () => {
    Alert.alert('Comment', 'Open comments section here.');
  };


  const handleShare = () => {
    Alert.alert('Share', 'Trigger share dialog here.');
  };


  const renderItem = ({ item, index }: { item: any; index: number }) => (
    <TouchableOpacity onPress={() => handleViewImage(index)} activeOpacity={0.8}>
      <View style={{ width: screenWidth }}>
        <Image source={item} style={styles.image} />
      </View>
    </TouchableOpacity>
  );


  return (
    <View style={styles.card}>
      <FlatList
        data={post.images}
        horizontal
        pagingEnabled
        keyExtractor={(_, index) => `${post.id}-${index}`}
        renderItem={renderItem}
        onMomentumScrollEnd={(e) => {
          const newIndex = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
          setCurrentImageIndex(newIndex);
        }}
        showsHorizontalScrollIndicator={false}
        getItemLayout={(_, index) => ({
          length: screenWidth,
          offset: screenWidth * index,
          index,
        })}
        style={{ width: screenWidth }}
      />


      <View style={styles.paginator}>
        {post.images.map((_, index) => {
          const distance = Math.abs(index - currentImageIndex);
          let dotSize = 4;
          let dotColor = '#ccc';


          if (distance === 0) {
            dotSize = 10;
            dotColor = '#1D9D65';
          } else if (distance === 1) {
            dotSize = 8;
          } else if (distance === 2) {
            dotSize = 6;
          }


          return (
            <View
              key={`${post.id}-dot-${index}`}
              style={{
                width: dotSize,
                height: dotSize,
                borderRadius: 50,
                backgroundColor: dotColor,
                marginHorizontal: 3,
              }}
            />
          );
        })}
      </View>


      <Text style={styles.username}>{post.user}</Text>
      <Text style={styles.date}>{post.date}</Text>
      <Text style={styles.caption}>{post.caption}</Text>


      <View style={styles.actions}>
        <TouchableOpacity onPress={handleLike}>
          <Icon
            name={liked ? 'heart' : 'heart-o'}
            size={22}
            color={liked ? '#E91E63' : '#444'}
            style={styles.actionIcon}
          />
        </TouchableOpacity>


        <TouchableOpacity onPress={handleComment}>
          <Icon name="comment-o" size={22} color="#444" style={styles.actionIcon} />
        </TouchableOpacity>


        <TouchableOpacity onPress={handleShare}>
          <Icon name="share" size={22} color="#444" style={styles.actionIcon} />
        </TouchableOpacity>
      </View>


      <ImageViewing
        images={post.images.map((img) => ({
          uri: Image.resolveAssetSource(img).uri,
        }))}
        imageIndex={currentImageIndex}
        visible={isViewerVisible}
        onRequestClose={() => setIsViewerVisible(false)}
      />
    </View>
  );
}


const styles = StyleSheet.create({
  card: {
    marginVertical: 14,
    marginHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  image: {
    width: screenWidth,
    height: 350,
    resizeMode: 'cover',
  },
  paginator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 8,
  },
  username: {
    fontWeight: 'bold',
    fontSize: 16,
    paddingHorizontal: 12,
    marginBottom: 2,
    color: '#333',
  },
  date: {
    fontSize: 12,
    paddingHorizontal: 12,
    color: '#888',
    marginBottom: 6,
  },
  caption: {
    fontSize: 14,
    paddingHorizontal: 12,
    marginBottom: 8,
    color: '#444',
  },
  actions: {
    flexDirection: 'row',
    padding: 12,
  },
  actionIcon: {
    marginRight: 20,
  },
});
