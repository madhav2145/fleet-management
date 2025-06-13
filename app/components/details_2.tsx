"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  BackHandler,
  Modal,
} from "react-native"
import { getResource } from "../../backend/waterUreaService"
import {
  ArrowLeft,
  Truck,
  Droplet,
  Package,
  Calendar,
  AlertCircle,
  Filter,
  X,
  ChevronDown,
  TrendingUp,
  BarChart3,
  Target,
  Lightbulb,
} from "lucide-react-native"
import DateTimePicker from "@react-native-community/datetimepicker"

interface DetailsPageProps {
  id: string // ID of the resource to fetch
  onBack: () => void // Callback to go back to the search page
}

const DetailsPage: React.FC<DetailsPageProps> = ({ id, onBack }) => {
  const [resource, setResource] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  // Date filter states
  const [isFilterActive, setIsFilterActive] = useState(false)
  const [startDate, setStartDate] = useState<Date>(new Date())
  const [endDate, setEndDate] = useState<Date>(new Date())
  const [showStartDatePicker, setShowStartDatePicker] = useState(false)
  const [showEndDatePicker, setShowEndDatePicker] = useState(false)
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [filteredLogs, setFilteredLogs] = useState<any[]>([])
  const [filteredTotals, setFilteredTotals] = useState({ water: 0, urea: 0 })

  // Analysis states
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [analysisLoading, setAnalysisLoading] = useState(false)

  const fetchResourceDetails = async () => {
    try {
      setIsLoading(true)
      const data = await getResource(id) // Fetch resource details by ID
      if (data) {
        setResource(data)
      } else {
        setError("Resource not found.")
      }
    } catch (err) {
      console.error("Error fetching resource details:", err)
      setError("Failed to fetch resource details.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      fetchResourceDetails()
    }
  }, [id])

  useEffect(() => {
    const backAction = () => {
      onBack() // Call the onBack callback to navigate back to the search page
      return true // Prevent default back button behavior
    }

    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction)

    return () => backHandler.remove() // Cleanup the event listener
  }, [onBack])

  // Extract logs from the resource data
  const allLogs = Object.keys(resource || {})
    .filter((key) => {
      if (id === "totalReceived") {
        // Exclude logs for total distributed, total water, and total urea when viewing totalReceived details
        return (
          key !== "totalDistributedWater" &&
          key !== "totalDistributedUrea" &&
          key !== "totalWater" &&
          key !== "totalUrea"
        )
      }
      return key !== "totalWater" && key !== "totalUrea" && key !== "vehicleNo" // Exclude totals and vehicleNo for other cases
    })
    .map((date) => ({
      date,
      water: resource[date]?.water || 0,
      urea: resource[date]?.urea || 0,
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Sort by date (newest to oldest)

  // Apply date filter when filter is active
  useEffect(() => {
    if (isFilterActive && startDate && endDate) {
      // Normalize startDate and endDate to midnight without mutating the original dates
      const startTimestamp = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()).getTime()
      const endTimestamp = new Date(
        endDate.getFullYear(),
        endDate.getMonth(),
        endDate.getDate(),
        23,
        59,
        59,
        999,
      ).getTime()

      // Filter logs only when necessary
      const filtered = (resource ? Object.keys(resource) : [])
        .filter((key) => {
          if (id === "totalReceived") {
            return (
              key !== "totalDistributedWater" &&
              key !== "totalDistributedUrea" &&
              key !== "totalWater" &&
              key !== "totalUrea"
            )
          }
          return key !== "totalWater" && key !== "totalUrea" && key !== "vehicleNo"
        })
        .map((date) => ({
          date,
          water: resource[date]?.water || 0,
          urea: resource[date]?.urea || 0,
        }))
        .filter((log) => {
          // Normalize log date to midnight
          const logDate = new Date(log.date).setHours(0, 0, 0, 0)
          // Ensure the log date is within the start and end date range
          return logDate >= startTimestamp && logDate <= endTimestamp
        })

      setFilteredLogs(filtered)

      // Calculate totals for filtered logs
      const waterTotal = filtered.reduce((sum, log) => sum + log.water, 0)
      const ureaTotal = filtered.reduce((sum, log) => sum + log.urea, 0)

      setFilteredTotals({
        water: waterTotal,
        urea: ureaTotal,
      })
    } else if (!isFilterActive) {
      setFilteredLogs([]) // Clear filtered logs when filter is inactive
    }
  }, [isFilterActive, startDate, endDate, resource, id])

  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(false)
    if (selectedDate) {
      setStartDate(selectedDate)
    }
  }

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(false)
    if (selectedDate) {
      setEndDate(selectedDate)
    }
  }

  const applyFilter = () => {
    setIsFilterActive(true)
    setShowFilterModal(false)
  }

  const clearFilter = () => {
    setIsFilterActive(false)
    setShowFilterModal(false)
  }

  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0]
  }

  // Enhanced analysis function with better prompts and mock data
  const handleAnalysis = async () => {
    setShowAnalysis(true)
    setAnalysisLoading(true)
    setAnalysisResult(null)

    // Prepare data for analysis (use filtered or all logs)
    const logs = isFilterActive ? filteredLogs : allLogs

    // Calculate statistics for better analysis
    const totalDays = logs.length
    const avgWater = logs.reduce((sum, log) => sum + log.water, 0) / totalDays || 0
    const avgUrea = logs.reduce((sum, log) => sum + log.urea, 0) / totalDays || 0
    const maxWater = Math.max(...logs.map((log) => log.water))
    const maxUrea = Math.max(...logs.map((log) => log.urea))

    let prompt = ""
    if (id === "totalReceived") {
      prompt = `Analyze water and urea inventory management data:
      
CURRENT STATISTICS:
- Total days analyzed: ${totalDays}
- Average daily water received: ${avgWater.toFixed(1)} packets
- Average daily urea received: ${avgUrea.toFixed(1)} buckets
- Peak water day: ${maxWater} packets
- Peak urea day: ${maxUrea} buckets

DETAILED LOGS:
${logs.map((l) => `${l.date}: Water=${l.water}, Urea=${l.urea}`).join("\n")}

Please provide:
1. Trend analysis (increasing/decreasing/stable)
2. Seasonal patterns if any
3. Recommended order quantities for next period
4. Risk assessment and buffer recommendations
5. Cost optimization suggestions`
    } else {
      prompt = `Analyze vehicle consumption patterns for ${resource?.vehicleNo || id}:
      
CONSUMPTION STATISTICS:
- Total days analyzed: ${totalDays}
- Average daily water usage: ${avgWater.toFixed(1)} packets
- Average daily urea usage: ${avgUrea.toFixed(1)} buckets
- Peak water usage: ${maxWater} packets
- Peak urea usage: ${maxUrea} buckets

USAGE LOGS:
${logs.map((l) => `${l.date}: Water=${l.water}, Urea=${l.urea}`).join("\n")}

Please provide:
1. Usage pattern analysis
2. Efficiency assessment
3. Predicted needs for next period
4. Maintenance schedule recommendations
5. Cost-saving opportunities`
    }

    try {
      // Mock enhanced analysis response
      setTimeout(() => {
        const mockAnalysis = {
          trend: {
            water: avgWater > 50 ? "increasing" : avgWater > 30 ? "stable" : "decreasing",
            urea: avgUrea > 20 ? "increasing" : avgUrea > 10 ? "stable" : "decreasing",
          },
          predictions: {
            water: Math.ceil(avgWater * 1.15),
            urea: Math.ceil(avgUrea * 1.1),
            confidence: "85%",
          },
          insights: [
            `${id === "totalReceived" ? "Inventory" : "Vehicle"} shows ${avgWater > 40 ? "high" : "moderate"} water consumption patterns`,
            `Urea usage is ${avgUrea > 15 ? "above" : "within"} expected range`,
            `${totalDays < 7 ? "Limited data available - consider longer analysis period" : "Sufficient data for reliable predictions"}`,
          ],
          recommendations: [
            `Order ${Math.ceil(avgWater * 7 * 1.2)} water packets for next week`,
            `Stock ${Math.ceil(avgUrea * 7 * 1.15)} urea buckets as buffer`,
            `Monitor usage patterns for optimization opportunities`,
          ],
          riskLevel: avgWater > 60 || avgUrea > 25 ? "high" : avgWater > 30 || avgUrea > 15 ? "medium" : "low",
        }
        setAnalysisResult(mockAnalysis)
        setAnalysisLoading(false)
      }, 2000)
    } catch (e) {
      setAnalysisResult({ error: "Failed to generate analysis. Please try again." })
      setAnalysisLoading(false)
    }
  }

  // Determine which logs to display
  const logsToDisplay = isFilterActive ? filteredLogs : allLogs

  // Determine which totals to display
  const totalsToDisplay = isFilterActive
    ? filteredTotals
    : {
        water: resource?.totalWater || 0,
        urea: resource?.totalUrea || 0,
      }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0A3D91" />
        <Text style={styles.loadingText}>Loading details...</Text>
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <AlertCircle size={48} color="#DC2626" style={styles.errorIcon} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.errorBackButton} onPress={onBack}>
          <Text style={styles.errorBackButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{id === "totalReceived" ? "Water and Urea Status" : "Vehicle Details"}</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      {/* Vehicle Number (Hide for totalReceived) */}
      {id !== "totalReceived" && (
        <View style={styles.vehicleHeaderCard}>
          <View style={styles.vehicleIconContainer}>
            <Truck size={32} color="#FFFFFF" />
          </View>
          <View style={styles.vehicleInfoContainer}>
            <Text style={styles.vehicleLabel}>Vehicle Number</Text>
            <Text style={styles.vehicleNo}>{resource?.vehicleNo || id}</Text>
          </View>
        </View>
      )}

      {/* Total Water and Urea */}
      <View style={styles.statsContainer}>
        <View style={styles.detailCard}>
          <View style={styles.cardIconContainer}>
            <Droplet size={24} color="#0EA5E9" />
          </View>
          <Text style={styles.label}>{isFilterActive ? "Filtered Water Packets" : "Total Water Packets"}</Text>
          <Text style={styles.value}>{totalsToDisplay.water}</Text>
        </View>

        <View style={styles.detailCard}>
          <View style={[styles.cardIconContainer, styles.ureaIconContainer]}>
            <Package size={24} color="#8B5CF6" />
          </View>
          <Text style={styles.label}>{isFilterActive ? "Filtered Urea Buckets" : "Total Urea Buckets"}</Text>
          <Text style={styles.value}>{totalsToDisplay.urea}</Text>
        </View>
      </View>

      {/* Logs of Dates and Quantities */}
      <View style={styles.logsHeaderContainer}>
        <Calendar size={20} color="#1E3A8A" />
        <Text style={styles.sectionHeading}>{isFilterActive ? "Filtered Activity Logs" : "Activity Logs"}</Text>
      </View>

      {/* Toggle Buttons for Activity Logs and Analysis */}
      <View style={styles.toggleButtonContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, !showAnalysis && styles.toggleButtonActive]}
          onPress={() => setShowAnalysis(false)}
        >
          <Text style={[styles.toggleButtonText, !showAnalysis && styles.toggleButtonTextActive]}>Activity Logs</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, showAnalysis && styles.toggleButtonActive]}
          onPress={() => handleAnalysis()}
        >
          <Text style={[styles.toggleButtonText, showAnalysis && styles.toggleButtonTextActive]}>Smart Analysis</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Button and Active Filter Indicator (below toggle buttons) */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, isFilterActive && styles.filterButtonActive]}
          onPress={() => setShowFilterModal(true)}
        >
          <Filter size={16} color={isFilterActive ? "#FFFFFF" : "#1E3A8A"} />
          <Text style={[styles.filterButtonText, isFilterActive && styles.filterButtonTextActive]}>
            {isFilterActive ? "Filter Active" : "Filter by Date"}
          </Text>
        </TouchableOpacity>
        {isFilterActive && (
          <View style={styles.activeFilterContainer}>
            <Text style={styles.activeFilterText}>{`${formatDate(startDate)} to ${formatDate(endDate)}`}</Text>
            <TouchableOpacity style={styles.clearFilterButton} onPress={clearFilter}>
              <X size={14} color="#1E3A8A" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Show Activity Logs or Analysis */}
      {!showAnalysis ? (
        logsToDisplay.length > 0 ? (
          logsToDisplay.map((log, index) => (
            <View key={index} style={styles.logCard}>
              <View style={styles.logDateContainer}>
                <Calendar size={18} color="#1E3A8A" style={styles.logIcon} />
                <Text style={styles.logDate}>{log.date}</Text>
              </View>
              <View style={styles.logDivider} />
              <View style={styles.logDetailsContainer}>
                <View style={styles.logDetailItem}>
                  <Droplet size={16} color="#0EA5E9" style={styles.logDetailIcon} />
                  <Text style={styles.logDetailLabel}>Water:</Text>
                  <Text style={styles.logDetailValue}>{log.water}</Text>
                </View>
                <View style={styles.logDetailItem}>
                  <Package size={16} color="#8B5CF6" style={styles.logDetailIcon} />
                  <Text style={styles.logDetailLabel}>Urea:</Text>
                  <Text style={styles.logDetailValue}>{log.urea}</Text>
                </View>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.noLogsContainer}>
            <AlertCircle size={24} color="#9CA3AF" />
            <Text style={styles.noLogsText}>
              {isFilterActive ? "No logs found in the selected date range." : "No logs available."}
            </Text>
          </View>
        )
      ) : (
        <View style={styles.analysisContainer}>
          {analysisLoading ? (
            <View style={styles.analysisLoadingContainer}>
              <ActivityIndicator size="large" color="#0A3D91" />
              <Text style={styles.analysisLoadingText}>Analyzing patterns and generating insights...</Text>
              <Text style={styles.analysisLoadingSubtext}>This may take a few moments</Text>
            </View>
          ) : analysisResult ? (
            analysisResult.error ? (
              <View style={styles.analysisErrorContainer}>
                <AlertCircle size={32} color="#DC2626" />
                <Text style={styles.analysisErrorText}>{analysisResult.error}</Text>
              </View>
            ) : (
              <ScrollView style={styles.analysisScrollContainer} showsVerticalScrollIndicator={false}>
                {/* Analysis Header */}
                <View style={styles.analysisHeader}>
                  <BarChart3 size={24} color="#1E3A8A" />
                  <Text style={styles.analysisTitle}>Smart Analysis Report</Text>
                </View>

                {/* Risk Level Indicator */}
                <View
                  style={[
                    styles.riskIndicator,
                    analysisResult.riskLevel === "high" && styles.riskHigh,
                    analysisResult.riskLevel === "medium" && styles.riskMedium,
                    analysisResult.riskLevel === "low" && styles.riskLow,
                  ]}
                >
                  <Text style={styles.riskLabel}>Risk Level</Text>
                  <Text
                    style={[
                      styles.riskValue,
                      analysisResult.riskLevel === "high" && styles.riskValueHigh,
                      analysisResult.riskLevel === "medium" && styles.riskValueMedium,
                      analysisResult.riskLevel === "low" && styles.riskValueLow,
                    ]}
                  >
                    {analysisResult.riskLevel.toUpperCase()}
                  </Text>
                </View>

                {/* Predictions Section */}
                <View style={styles.analysisSection}>
                  <View style={styles.analysisSectionHeader}>
                    <Target size={20} color="#059669" />
                    <Text style={styles.analysisSectionTitle}>Next Period Predictions</Text>
                  </View>
                  <View style={styles.predictionContainer}>
                    <View style={styles.predictionCard}>
                      <Droplet size={20} color="#0EA5E9" />
                      <Text style={styles.predictionLabel}>Water</Text>
                      <Text style={styles.predictionValue}>{analysisResult.predictions.water}</Text>
                      <Text style={styles.predictionUnit}>packets</Text>
                    </View>
                    <View style={styles.predictionCard}>
                      <Package size={20} color="#8B5CF6" />
                      <Text style={styles.predictionLabel}>Urea</Text>
                      <Text style={styles.predictionValue}>{analysisResult.predictions.urea}</Text>
                      <Text style={styles.predictionUnit}>buckets</Text>
                    </View>
                  </View>
                  <Text style={styles.confidenceText}>Confidence Level: {analysisResult.predictions.confidence}</Text>
                </View>

                {/* Trend Analysis */}
                <View style={styles.analysisSection}>
                  <View style={styles.analysisSectionHeader}>
                    <TrendingUp size={20} color="#F59E0B" />
                    <Text style={styles.analysisSectionTitle}>Trend Analysis</Text>
                  </View>
                  <View style={styles.trendContainer}>
                    <View style={styles.trendItem}>
                      <Text style={styles.trendLabel}>Water Trend:</Text>
                      <View
                        style={[
                          styles.trendBadge,
                          analysisResult.trend.water === "increasing" && styles.trendIncreasing,
                          analysisResult.trend.water === "stable" && styles.trendStable,
                          analysisResult.trend.water === "decreasing" && styles.trendDecreasing,
                        ]}
                      >
                        <Text style={styles.trendBadgeText}>{analysisResult.trend.water}</Text>
                      </View>
                    </View>
                    <View style={styles.trendItem}>
                      <Text style={styles.trendLabel}>Urea Trend:</Text>
                      <View
                        style={[
                          styles.trendBadge,
                          analysisResult.trend.urea === "increasing" && styles.trendIncreasing,
                          analysisResult.trend.urea === "stable" && styles.trendStable,
                          analysisResult.trend.urea === "decreasing" && styles.trendDecreasing,
                        ]}
                      >
                        <Text style={styles.trendBadgeText}>{analysisResult.trend.urea}</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Key Insights */}
                <View style={styles.analysisSection}>
                  <View style={styles.analysisSectionHeader}>
                    <Lightbulb size={20} color="#7C3AED" />
                    <Text style={styles.analysisSectionTitle}>Key Insights</Text>
                  </View>
                  {analysisResult.insights.map((insight: string, index: number) => (
                    <View key={index} style={styles.insightItem}>
                      <View style={styles.insightBullet} />
                      <Text style={styles.insightText}>{insight}</Text>
                    </View>
                  ))}
                </View>

                {/* Recommendations */}
                <View style={styles.analysisSection}>
                  <View style={styles.analysisSectionHeader}>
                    <AlertCircle size={20} color="#DC2626" />
                    <Text style={styles.analysisSectionTitle}>Recommendations</Text>
                  </View>
                  {analysisResult.recommendations.map((recommendation: string, index: number) => (
                    <View key={index} style={styles.recommendationItem}>
                      <Text style={styles.recommendationNumber}>{index + 1}</Text>
                      <Text style={styles.recommendationText}>{recommendation}</Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            )
          ) : (
            <View style={styles.analysisPlaceholder}>
              <BarChart3 size={48} color="#9CA3AF" />
              <Text style={styles.analysisPlaceholderText}>No analysis available</Text>
            </View>
          )}
        </View>
      )}

      {/* Date Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowFilterModal(false)}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter by Date Range</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              {/* Start Date Selector */}
              <Text style={styles.modalLabel}>Start Date</Text>
              <TouchableOpacity style={styles.datePickerButton} onPress={() => setShowStartDatePicker(true)}>
                <Calendar size={18} color="#1E3A8A" style={styles.datePickerIcon} />
                <Text style={styles.datePickerText}>{formatDate(startDate)}</Text>
                <ChevronDown size={18} color="#64748B" />
              </TouchableOpacity>

              {/* End Date Selector */}
              <Text style={styles.modalLabel}>End Date</Text>
              <TouchableOpacity style={styles.datePickerButton} onPress={() => setShowEndDatePicker(true)}>
                <Calendar size={18} color="#1E3A8A" style={styles.datePickerIcon} />
                <Text style={styles.datePickerText}>{formatDate(endDate)}</Text>
                <ChevronDown size={18} color="#64748B" />
              </TouchableOpacity>

              {/* Action Buttons */}
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalCancelButton} onPress={() => setShowFilterModal(false)}>
                  <Text style={styles.modalCancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.modalApplyButton} onPress={applyFilter}>
                  <Text style={styles.modalApplyButtonText}>Apply Filter</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Date Pickers */}
      {showStartDatePicker && (
        <DateTimePicker value={startDate} mode="date" display="default" onChange={handleStartDateChange} />
      )}

      {showEndDatePicker && (
        <DateTimePicker value={endDate} mode="date" display="default" onChange={handleEndDateChange} />
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  contentContainer: {
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    backgroundColor: "#1E3A8A",
    paddingHorizontal: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    marginBottom: 10,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
  },
  headerPlaceholder: {
    width: 40, // Same width as back button for balance
  },
  vehicleHeaderCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  vehicleIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#1E3A8A",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    shadowColor: "#1E3A8A",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  vehicleInfoContainer: {
    flex: 1,
  },
  vehicleLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
  vehicleNo: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1E3A8A",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginBottom: 16,
  },
  detailCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    width: "48%",
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(14, 165, 233, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  ureaIconContainer: {
    backgroundColor: "rgba(139, 92, 246, 0.15)",
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#4B5563",
    marginBottom: 6,
    textAlign: "center",
  },
  value: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },
  filterContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#1E3A8A",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  filterButtonActive: {
    backgroundColor: "#1E3A8A",
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E3A8A",
    marginLeft: 6,
  },
  filterButtonTextActive: {
    color: "#FFFFFF",
  },
  activeFilterContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(30, 58, 138, 0.1)",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  activeFilterText: {
    fontSize: 14,
    color: "#1E3A8A",
    fontWeight: "500",
  },
  clearFilterButton: {
    padding: 4,
  },
  logsHeaderContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    marginTop: 8,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1E3A8A",
    marginLeft: 8,
  },
  logCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
    overflow: "hidden",
  },
  logDateContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "rgba(30, 58, 138, 0.05)",
  },
  logIcon: {
    marginRight: 8,
  },
  logDate: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  logDivider: {
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  logDetailsContainer: {
    padding: 12,
  },
  logDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  logDetailIcon: {
    marginRight: 8,
  },
  logDetailLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#4B5563",
    width: 50,
  },
  logDetailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  noLogsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  noLogsText: {
    fontSize: 15,
    color: "#6B7280",
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#4B5563",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#FEF2F2",
  },
  errorIcon: {
    marginBottom: 16,
  },
  errorText: {
    fontSize: 18,
    color: "#DC2626",
    textAlign: "center",
    marginBottom: 24,
  },
  errorBackButton: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#1E40AF",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  errorBackButtonText: {
    color: "#1E40AF",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    width: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1E3A8A",
  },
  modalContent: {
    padding: 16,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#4B5563",
    marginBottom: 8,
  },
  datePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  datePickerIcon: {
    marginRight: 8,
  },
  datePickerText: {
    flex: 1,
    fontSize: 16,
    color: "#1F2937",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
  },
  modalCancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  modalCancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  modalApplyButton: {
    backgroundColor: "#1E3A8A",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  modalApplyButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  toggleButtonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 10,
    marginTop: 0,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#1E3A8A",
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: "center",
  },
  toggleButtonActive: {
    backgroundColor: "#1E3A8A",
  },
  toggleButtonText: {
    color: "#1E3A8A",
    fontWeight: "600",
    fontSize: 15,
  },
  toggleButtonTextActive: {
    color: "#FFFFFF",
  },
  // Enhanced Analysis Styles
  analysisContainer: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 400,
  },
  analysisLoadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  analysisLoadingText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E3A8A",
    marginTop: 16,
    textAlign: "center",
  },
  analysisLoadingSubtext: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 8,
    textAlign: "center",
  },
  analysisErrorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  analysisErrorText: {
    fontSize: 16,
    color: "#DC2626",
    textAlign: "center",
    marginTop: 12,
  },
  analysisPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  analysisPlaceholderText: {
    fontSize: 16,
    color: "#9CA3AF",
    marginTop: 12,
  },
  analysisScrollContainer: {
    flex: 1,
    padding: 20,
  },
  analysisHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  analysisTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E3A8A",
    marginLeft: 8,
  },
  riskIndicator: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  riskHigh: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderWidth: 1,
    borderColor: "#EF4444",
  },
  riskMedium: {
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    borderWidth: 1,
    borderColor: "#F59E0B",
  },
  riskLow: {
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    borderWidth: 1,
    borderColor: "#22C55E",
  },
  riskLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  riskValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  riskValueHigh: {
    color: "#EF4444",
  },
  riskValueMedium: {
    color: "#F59E0B",
  },
  riskValueLow: {
    color: "#22C55E",
  },
  analysisSection: {
    marginBottom: 24,
  },
  analysisSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  analysisSectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginLeft: 8,
  },
  predictionContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  predictionCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    width: "48%",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  predictionLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748B",
    marginTop: 8,
    marginBottom: 4,
  },
  predictionValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1E293B",
  },
  predictionUnit: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  confidenceText: {
    fontSize: 14,
    color: "#059669",
    fontWeight: "600",
    textAlign: "center",
    backgroundColor: "rgba(5, 150, 105, 0.1)",
    padding: 8,
    borderRadius: 8,
  },
  trendContainer: {
    gap: 12,
  },
  trendItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  trendLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#374151",
  },
  trendBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  trendIncreasing: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  trendStable: {
    backgroundColor: "rgba(245, 158, 11, 0.1)",
  },
  trendDecreasing: {
    backgroundColor: "rgba(34, 197, 94, 0.1)",
  },
  trendBadgeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    textTransform: "capitalize",
  },
  insightItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  insightBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#7C3AED",
    marginTop: 6,
    marginRight: 12,
  },
  insightText: {
    fontSize: 15,
    color: "#374151",
    lineHeight: 22,
    flex: 1,
  },
  recommendationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
    backgroundColor: "#FEF2F2",
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#DC2626",
  },
  recommendationNumber: {
    fontSize: 16,
    fontWeight: "700",
    color: "#DC2626",
    marginRight: 12,
    minWidth: 20,
  },
  recommendationText: {
    fontSize: 15,
    color: "#374151",
    lineHeight: 22,
    flex: 1,
  },
})

export default DetailsPage
