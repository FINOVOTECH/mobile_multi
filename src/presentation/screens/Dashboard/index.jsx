import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    Platform,
    ActivityIndicator,
    Image,
} from 'react-native';
import { widthToDp, heightToDp } from '../../../helpers/Responsive';
import { useSelector } from 'react-redux';
import { apiGetService } from '../../../helpers/services';
import * as Config from '../../../helpers/Config';
import LinearGradient from 'react-native-linear-gradient';
import bgVector from '../../../assets/Icons/vector.png';
import SInfoSvg from '../../svgs';

const SIPPortfolio = ({ navigation }) => {
    const loginData = useSelector(state => state.login.loginData);
    const [sortBy, setSortBy] = useState('Due date');
    const [sipData, setSipData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [totalSipAmount, setTotalSipAmount] = useState(0);

    useEffect(() => {
        fetchSipData();
    }, []);

    const fetchSipData = async () => {
        try {
            setIsLoading(true);
            const response = await apiGetService(`/api/v1/admin/feature/history/transaction?transactionType=SIP&status=ACTIVE`)
            if (response.status === 200) {
                const data = response?.data?.results || [];
                setSipData(data);
                
                // Calculate total SIP amount
                const total = data.reduce((sum, item) => {
                    const amount = item.noOfInstallment || item.sipAmount || item.investmentAmount || 0;
                    return sum + parseFloat(amount);
                }, 0);
                setTotalSipAmount(total);
                
                console.log('SIP data fetched successfully:', response);
            }
        } catch (error) {
            console.error('Error fetching SIP data:', error);
        } finally {
            setIsLoading(false);
        }
    }

    // Helper function to generate logo from fund name
    const generateLogo = (fundName) => {
        if (!fundName) return 'MF';
        const words = fundName.split(' ');
        if (words.length >= 2) {
            return (words[0][0] + words[1][0]).toUpperCase();
        }
        return fundName.substring(0, 2).toUpperCase();
    };

    // Helper function to generate random color for logo
    const generateColor = (index) => {
        const colors = ['#4F46E5', '#059669', '#DC2626', '#7C2D12', '#1E40AF', '#BE123C', '#9333EA'];
        return colors[index % colors.length];
    };

    const formatDueDate = (dateString) => {
        if (!dateString) return { date: '00', month: 'Jan' };

        try {
            // Handle "DD/MM/YYYY" format
            const parts = dateString.split('/');
            if (parts.length === 3) {
                const [day, month, year] = parts;
                const date = new Date(`${year}-${month}-${day}`);
                const dayFormatted = date.getDate().toString().padStart(2, '0');
                const monthFormatted = date.toLocaleDateString('en-US', { month: 'short' });
                return { date: dayFormatted, month: monthFormatted };
            }

            // Fallback: try to parse directly
            const date = new Date(dateString);
            const day = date.getDate().toString().padStart(2, '0');
            const month = date.toLocaleDateString('en-US', { month: 'short' });
            return { date: day, month: month };
        } catch (error) {
            return { date: '00', month: 'Jan' };
        }
    };

    const Header = () => (
        <LinearGradient
            colors={['#2B8DF6', '#2B8DF6']}
            style={styles.headerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
        >
            <Image
                source={bgVector}
                style={[StyleSheet.absoluteFillObject, { opacity: 0.1 }]}
                resizeMode="cover"
            />
            <View style={styles.headerContent}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <SInfoSvg.WhiteBackButton />
                </TouchableOpacity>
                <View style={styles.headerTextContainer}>
                    <Text style={styles.headerTitle}>SIP Portfolio</Text>
                    <Text style={styles.headerSubtitle}>Manage your Systematic Investment Plans</Text>
                </View>
            </View>

            {/* Total Amount Card */}
            <View style={styles.totalAmountCard}>
                <Text style={styles.totalAmountLabel}>Monthly SIP Amount</Text>
                <Text style={styles.totalAmount}>₹{totalSipAmount.toLocaleString()}</Text>
                <Text style={styles.activeSipsCount}>{sipData.length} Active SIP{sipData.length !== 1 ? 's' : ''}</Text>
            </View>
        </LinearGradient>
    );

    const renderSIPItem = ({ item, index }) => {
        const fundName = item?.schemedetails?.schemeName || 'Unknown Fund';
        const amount = item?.schemedetails?.price  || 0;
        const dueDate = item?.nextDebitDate || item.nextDueDate || item.date || new Date().toISOString();
        
        const logo = generateLogo(fundName);
        const color = generateColor(index);
        const { date, month } = formatDueDate(dueDate);

        return (
            <View style={styles.sipItem}>
                <View style={styles.sipContent}>
                    <View style={[styles.logoContainer, { backgroundColor: color }]}>
                        <Text style={styles.logoText}>{logo}</Text>
                    </View>

                    <View style={styles.sipDetails}>
                        <Text style={styles.fundName} numberOfLines={2}>
                            {fundName}
                        </Text>
                        <Text style={styles.amount}>₹{parseFloat(amount).toLocaleString()}</Text>
                    </View>

                    <View style={styles.dueDateContainer}>
                        <Text style={styles.dueDateLabel}>Due on</Text>
                        <View style={styles.dueDateCircle}>
                            <Text style={styles.dueDate}>{date}</Text>
                            <Text style={styles.dueDateMonth}>{month}</Text>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No active SIPs found</Text>
            <Text style={styles.emptyStateSubtext}>Start investing to see your SIPs here</Text>
        </View>
    );

    const renderLoadingState = () => (
        <View style={styles.loadingState}>
            <ActivityIndicator size="large" color="#2B8DF6" />
            <Text style={styles.loadingText}>Loading your SIPs...</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            {Platform.OS === 'android' && <View style={styles.androidStatusBar} />}
            <StatusBar barStyle="light-content" backgroundColor="#2B8DF6" />
            
            <Header />

            <View style={styles.content}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Active SIPs</Text>
                    <TouchableOpacity style={styles.sortButton}>
                        <Text style={styles.sortText}>Sort by: {sortBy}</Text>
                        <Text style={styles.sortIcon}>⌄</Text>
                    </TouchableOpacity>
                </View>

                {isLoading ? (
                    renderLoadingState()
                ) : (
                    <FlatList
                        data={sipData}
                        renderItem={renderSIPItem}
                        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
                        showsVerticalScrollIndicator={false}
                        style={styles.sipList}
                        ListEmptyComponent={renderEmptyState}
                        refreshing={isLoading}
                        onRefresh={fetchSipData}
                    />
                )}

                <TouchableOpacity style={styles.cancelledSipsButton}>
                    <Text style={styles.cancelledSipsText}>View cancelled SIPs (1)</Text>
                    <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Config.Colors.cyan_blue,
    },
    androidStatusBar: {
        height: StatusBar.currentHeight,
        backgroundColor: '#2B8DF6',
    },

    // Header Styles
    headerGradient: {
        backgroundColor: '#2B8DF6',
        paddingBottom: heightToDp(4),
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: widthToDp(4),
        paddingTop: heightToDp(1),
    },
    backButton: {
        marginRight: widthToDp(3),
        padding: widthToDp(1.5),
    },
    headerTextContainer: {
        flex: 1,
        paddingRight: widthToDp(2),
    },
    headerTitle: {
        fontSize: widthToDp(4.5),
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    headerSubtitle: {
        fontSize: widthToDp(3.5),
        color: '#E6F3FF',
        marginTop: heightToDp(0.5),
    },

    // Total Amount Card
    totalAmountCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        marginHorizontal: widthToDp(4),
        marginTop: heightToDp(2),
        padding: widthToDp(4),
        borderRadius: widthToDp(3),
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    },
    totalAmountLabel: {
        fontSize: widthToDp(3.5),
        color: '#666',
        marginBottom: heightToDp(0.5),
        fontWeight: '500',
    },
    totalAmount: {
        fontSize: widthToDp(8),
        fontWeight: 'bold',
        color: '#333',
        marginBottom: heightToDp(0.5),
    },
    activeSipsCount: {
        fontSize: widthToDp(3.5),
        color: '#2B8DF6',
        fontWeight: '600',
    },

    // Content Area
    content: {
        flex: 1,
        backgroundColor: Config.Colors.cyan_blue,
        marginTop: -heightToDp(2),
    },

    // Section Header
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: widthToDp(4),
        paddingVertical: heightToDp(2),
        backgroundColor: Config.Colors.cyan_blue,
    },
    sectionTitle: {
        fontSize: widthToDp(4.2),
        fontWeight: '700',
        color: '#333',
    },
    sortButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: widthToDp(3),
        paddingVertical: heightToDp(1),
        borderRadius: widthToDp(2),
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    sortText: {
        fontSize: widthToDp(3.2),
        color: '#666',
        marginRight: widthToDp(1),
        fontWeight: '500',
    },
    sortIcon: {
        fontSize: widthToDp(3.5),
        color: '#666',
    },

    // SIP List
    sipList: {
        flex: 1,
        paddingHorizontal: widthToDp(4),
    },

    // SIP Item
    sipItem: {
        backgroundColor: '#FFFFFF',
        borderRadius: widthToDp(3),
        marginBottom: heightToDp(1.5),
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sipContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: widthToDp(4),
    },
    logoContainer: {
        width: widthToDp(12),
        height: widthToDp(12),
        borderRadius: widthToDp(6),
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: widthToDp(3),
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
    },
    logoText: {
        color: '#FFFFFF',
        fontSize: widthToDp(4),
        fontWeight: 'bold',
    },
    sipDetails: {
        flex: 1,
        marginRight: widthToDp(3),
    },
    fundName: {
        fontSize: widthToDp(3.8),
        fontWeight: '600',
        color: '#333',
        marginBottom: heightToDp(0.5),
        lineHeight: widthToDp(4.5),
    },
    amount: {
        fontSize: widthToDp(3.8),
        color: '#2B8DF6',
        fontWeight: '600',
    },
    dueDateContainer: {
        alignItems: 'center',
    },
    dueDateLabel: {
        fontSize: widthToDp(2.8),
        color: '#666',
        marginBottom: heightToDp(0.5),
        fontWeight: '500',
    },
    dueDateCircle: {
        alignItems: 'center',
        backgroundColor: '#F8F9FF',
        paddingHorizontal: widthToDp(2),
        paddingVertical: heightToDp(0.5),
        borderRadius: widthToDp(2),
        borderWidth: 1,
        borderColor: '#E6F3FF',
    },
    dueDate: {
        fontSize: widthToDp(4),
        fontWeight: 'bold',
        color: '#2B8DF6',
    },
    dueDateMonth: {
        fontSize: widthToDp(2.8),
        color: '#666',
        fontWeight: '500',
    },

    // Cancelled SIPs Button
    cancelledSipsButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingVertical: heightToDp(2),
        paddingHorizontal: widthToDp(4),
        borderRadius: widthToDp(3),
        marginHorizontal: widthToDp(4),
        marginBottom: heightToDp(2),
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cancelledSipsText: {
        fontSize: widthToDp(3.8),
        color: '#666',
        fontWeight: '500',
    },
    chevron: {
        fontSize: widthToDp(5),
        color: '#666',
    },

    // Loading State
    loadingState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: heightToDp(10),
    },
    loadingText: {
        marginTop: heightToDp(2),
        fontSize: widthToDp(4),
        color: '#666',
        fontWeight: '500',
    },

    // Empty State
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: heightToDp(10),
        paddingHorizontal: widthToDp(8),
    },
    emptyStateText: {
        fontSize: widthToDp(4.5),
        fontWeight: '600',
        color: '#333',
        marginBottom: heightToDp(1),
        textAlign: 'center',
    },
    emptyStateSubtext: {
        fontSize: widthToDp(3.8),
        color: '#666',
        textAlign: 'center',
        lineHeight: heightToDp(3),
    },
});

export default SIPPortfolio;