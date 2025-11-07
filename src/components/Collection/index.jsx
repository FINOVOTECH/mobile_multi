import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native'
import React from 'react'
import { widthToDp, heightToDp } from '../../helpers/Responsive'
import SInfoSvg from '../../presentation/svgs'
import * as Config from '../../helpers/Config'
import * as Icons from "../../helpers/Icons"
import { useDispatch } from 'react-redux'
import { setFundTyoe } from '../../store/slices/marketSlice'
import { useNavigation } from '@react-navigation/native'

const Collection = () => {
  const navigate = useNavigation();
  const dispatch = useDispatch();
  const collectionsData = [
    {
      id: 2,
      title: 'Hybrid Funds',
    icon: Icons.highReturn,
      color: '#4ECDC4',
       type:"HYBRID"
    },
    {
      id: 1,
      title: 'Liquid Fund',
      icon: Icons.sip100,
      color: '#4ECDC4',
       type:"LIQUID"
    },
    {
      id: 3,
      title: 'Gold Funds',
      icon: Icons.gold_fund,
      color: '#4ECDC4',
       type:"GOLD"
    },
    {
      id: 4,
      title: 'Large Cap',
     icon: Icons.largeCap,
      color: '#4ECDC4',
      type:"LARGE"
    },
    {
      id: 5,
      title: 'Mid Cap',
       icon: Icons.midCap,
      color: '#4ECDC4',
      type:"MID"
    },
    {
      id: 6,
      title: 'Small Cap',
      icon: Icons.smallCap,
      color: '#4ECDC4',
      type:"SMALL"
    }
  ]

  const handleClick = (item)=>{
    console.log('Clicked Item:', item);
    navigate.navigate("SipScheme")
    dispatch(setFundTyoe({ value: item.type }));
  }

  const renderCollectionItem = (item) => (
    <TouchableOpacity 
    onPress={()=>handleClick(item)}
    key={item.id} style={styles.collectionItem}>
      <View style={styles.iconContainer}>
        <View style={[styles.iconBox, { backgroundColor:Config.Colors.cyan_blue }]}>
          {item.icon && (
            // <item.icon 
            //   style={styles.icon}
            // />
            <Image
              source={item.icon}
              style={styles.icon}
            />
          )}
        </View>
      </View>
      <Text style={styles.collectionTitle}>{item.title}</Text>
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>
      <View style={{ flexDirection: 'row', alignItems: 'center',justifyContent:'start'}}>
        {/* <Image source={}/> */}
        <SInfoSvg.Collection />
      <Text style={styles.header}>Collections</Text>
      </View>
      <View style={styles.collectionsGrid}>
        {collectionsData.map(item => renderCollectionItem(item))}
      </View>
    </View>
  )
}

export default Collection

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Config.Colors.cyan_blue,
    // paddingHorizontal: widthToDp(4),
     marginHorizontal: widthToDp(2),
    paddingTop: heightToDp(1),
    // borderWidth: 1,
    // borderColor: Config.Colors.black,
  },
  header: {
    fontSize: widthToDp(4),
    fontWeight: '700',
    marginLeft: widthToDp(2),
    color: '#333333',
    fontFamily: Config.fontFamilys.Poppins_SemiBold
  },
  collectionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: widthToDp(2),
    paddingVertical:heightToDp(1)
  },
  collectionItem: {
    width: widthToDp(28),
    alignItems: 'center',
    // marginBottom: heightToDp(4),
    paddingVertical: heightToDp(1)
  },
  iconContainer: {
    marginBottom: heightToDp(1.5)
  },
  iconBox: {
    // width: widthToDp(16),
    // height: widthToDp(16),
    borderRadius: widthToDp(2),
    justifyContent: 'center',
    alignItems: 'center',
    // shadowColor: '#000',
    // shadowOffset: {
    //   width: 0,
    //   height: 2,
    // },
    // shadowOpacity: 0.1,
    // shadowRadius: 3.84,
    // elevation: 5,
  },
  icon: {
    width: widthToDp(15),
    height: widthToDp(13),
    backgroundColor:Config.Colors.cyan_blue,
  },
  collectionTitle: {
    fontSize: widthToDp(3.5),
    color: '#666666',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: widthToDp(4.5)
  }
})