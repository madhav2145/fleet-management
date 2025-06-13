import React, { useEffect, useState } from "react"
import { View, Text, ScrollView, StyleSheet, SafeAreaView, StatusBar, ActivityIndicator, TouchableOpacity, BackHandler } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { collection, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { firestore } from '../../firebaseConfig';
import { useRouter } from 'expo-router';

interface HealthReportData {
  vehicleInfo: {
    vehicleNumber: string
    vehicleType: string
    driverName: string
    contactNumber: string
    kilometers: string
    maintenanceDate: string
    totalMaintenanceTime: string
  }
  overallHealth: {
    score: number
    status: "Excellent" | "Good" | "Fair" | "Poor" | "Critical"
    summary: string
  }
  systemReports: {
    mechanical: SystemReport
    electrical: SystemReport
    body: SystemReport
    tyre: SystemReport
    other?: SystemReport
  }
  recommendations: string[]
  nextServiceDue: {
    kilometers: string
    estimatedDate: string
    priority: "Low" | "Medium" | "High"
  }
  aiInsights: string
}

interface SystemReport {
  status: "Good" | "Warning" | "Critical"
  issues: string[]
  repairableItems: string[]
  replacementItems: string[]
  checkedBy: string
  healthScore: number
  recommendations: string[]
}

interface Details4_2Props {
  vehicleId: string;
  onBack?: () => void;
}

const VehicleHealthReport: React.FC<Details4_2Props> = ({ vehicleId, onBack }) => {
  const router = useRouter();
  const [healthReport, setHealthReport] = useState<HealthReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch vehicle and last maintenance, then call Gemini
  useEffect(() => {
    const fetchVehicleData = async (vehicleId: string) => {
      try {
        // Fetch vehicle doc
        const vehicleSnap = await getDocs(collection(firestore, 'vehicles'));
        let vehicleData: any = null;
        vehicleSnap.forEach(doc => {
          if (doc.id === vehicleId) {
            vehicleData = doc.data();
          }
        });
        if (!vehicleData) return null;
        // Fetch jobcard by vehicleNo (not doc.id, but vehicleNo field)
        const jobcardSnap = await getDocs(collection(firestore, 'jobcard'));
        let lastJobcard: any = null;
        let vehicleNo: string = vehicleId;
        if (vehicleData && typeof vehicleData === 'object' && 'vehicleNo' in vehicleData && vehicleData.vehicleNo) {
          vehicleNo = vehicleData.vehicleNo;
        }
        jobcardSnap.forEach(doc => {
          if (doc.id === vehicleNo) {
            const data = doc.data();
            const jobcardKeys = Object.keys(data).filter(key => key.startsWith('jobcard_'));
            const jobcards = jobcardKeys.map(key => ({ ...data[key], key })).filter(jc => jc.date);
            jobcards.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            lastJobcard = jobcards.find(jc => !jc.dispatchDate) || jobcards[0] || null;
          }
        });
        // If lastJobcard.issues exists, convert each issue type to a structured object for Gemini
        let systemIssues: any = {};
        if (lastJobcard && lastJobcard.issues) {
          for (const type of ['engine', 'electrical', 'body', 'tyre', 'warranty', 'other']) {
            const issue = lastJobcard.issues[type];
            systemIssues[type] = {
              description: issue?.description || '',
              repaired: issue?.repaired || '',
              replaced: issue?.replaced || ''
            };
          }
        }
        // Compose a clean object for Gemini
        return {
          vehicleNumber: vehicleNo,
          vehicleType: vehicleData.vehicleType || '',
          driverName: lastJobcard?.driverName || '',
          contactNumber: lastJobcard?.driverContact || '',
          kilometers: lastJobcard?.kilometers || vehicleData.kilometers || '',
          maintenanceDate: lastJobcard?.date || '',
          totalMaintenanceTime: '',
          vehicleCompany: lastJobcard?.vehicleCompany || vehicleData.vehicleCompany || '',
          signDriver: lastJobcard?.signDriver || '',
          signOperator: lastJobcard?.signOperator || '',
          signManager: lastJobcard?.signManager || '',
          issues: systemIssues,
          unsolvedIssues: lastJobcard?.unsolvedIssues || {},
        };
      } catch (err) {
        return null;
      }
    };
    const fetchLastMaintenanceDetails = async (vehicleId: string) => {
      try {
        const docSnap = await getDocs(collection(firestore, 'jobcard'));
        let jobcards: any[] = [];
        docSnap.forEach(doc => {
          if (doc.id === vehicleId) {
            const data = doc.data();
            Object.keys(data)
              .filter(key => key.startsWith('jobcard_'))
              .forEach(key => {
                const jc = data[key];
                if (jc) {
                  jobcards.push({ ...jc, key });
                }
              });
          }
        });
        jobcards = jobcards.filter(jc => jc.date).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        let last = jobcards.find(jc => !jc.dispatchDate) || jobcards[0];
        return last || null;
      } catch (err) {
        return null;
      }
    };
    const getHealthReportFromGemini = async (vehicleData: any, maintenanceData: any) => {
      try {
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
        // Compose a detailed prompt for system analysis
        const prompt = `Given the following vehicle and its last maintenance jobcard, generate a health report in the following JSON format:

{
  "vehicleInfo": {
    "vehicleNumber": string,
    "vehicleType": string,
    "driverName": string,
    "contactNumber": string,
    "kilometers": string,
    "maintenanceDate": string,
    "totalMaintenanceTime": string,
    "vehicleCompany": string,
    "signDriver": string,
    "signOperator": string,
    "signManager": string
  },
  "overallHealth": {
    "score": number,
    "status": "Excellent" | "Good" | "Fair" | "Poor" | "Critical",
    "summary": string
  },
  "systemReports": {
    "mechanical": {
      "status": "Good" | "Warning" | "Critical",
      "issues": string[],
      "repairableItems": string[],
      "replacementItems": string[],
      "checkedBy": string,
      "healthScore": number,
      "recommendations": string[]
    },
    "electrical": { ... },
    "body": { ... },
    "tyre": { ... },
    "other": { ... }
  },
  "recommendations": string[],
  "nextServiceDue": {
    "kilometers": string,
    "estimatedDate": string,
    "priority": "Low" | "Medium" | "High"
  },
  "aiInsights": string
}

Vehicle Data:
${JSON.stringify(vehicleData, null, 2)}

Jobcard Issues (for system analysis):
${JSON.stringify(vehicleData.issues, null, 2)}

Unsolved Issues:
${JSON.stringify(vehicleData.unsolvedIssues, null, 2)}

Return only the JSON object. Make sure to fill the systemReports fields based on the jobcard issues and maintenance details.`;
        const body = {
          contents: [{ parts: [{ text: prompt }] }]
        };
        const response = await fetch(GEMINI_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });
        if (!response.ok) {
          throw new Error('Gemini API error');
        }
        const json = await response.json();
        const aiText = json?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!aiText) return null;
        const match = aiText.match(/\{[\s\S]*\}/);
        if (!match) return null;
        return JSON.parse(match[0]);
      } catch (err) {
        return null;
      }
    };
    (async () => {
      setLoading(true);
      setError(null);
      setHealthReport(null);
      const vehicleData = await fetchVehicleData(vehicleId);
      const lastMaintenance = await fetchLastMaintenanceDetails(vehicleId);
      // Fix: Allow health report to generate even if lastMaintenance is missing, but vehicleData must exist
      if (!vehicleData) {
        setError('No vehicle data found.');
        setLoading(false);
        return;
      }
      // If no maintenance, pass null/empty to Gemini, but still try to generate a report
      // Instead of lastMaintenance, just use vehicleData (already merged and structured)
      const report = await getHealthReportFromGemini(vehicleData, vehicleData);
      if (report) {
        setHealthReport(report);
      } else {
        setError('Failed to generate health report.');
      }
      setLoading(false);
    })();
  }, [vehicleId]);

  // Add hardware back handler (like details_4.1)
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (onBack) onBack();
      else router.back();
      return true;
    });
    return () => {
      backHandler.remove();
    };
  }, [onBack]);

  const getStatusColor = (status: string | undefined) => {
    if (!status) return "#6B7280";
    switch (status.toLowerCase()) {
      case "excellent":
      case "good":
        return "#10B981"
      case "fair":
      case "warning":
        return "#F59E0B"
      case "poor":
      case "critical":
        return "#EF4444"
      default:
        return "#6B7280"
    }
  }

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return "#10B981"
    if (score >= 60) return "#F59E0B"
    return "#EF4444"
  }

  const HealthScoreCircle: React.FC<{ score: number; size?: number }> = ({ score, size = 80 }) => (
    <View style={[styles.scoreCircle, { width: size, height: size }]}>
      <Text style={[styles.scoreText, { fontSize: size * 0.25 }]}>{score}</Text>
      <Text style={[styles.scoreLabel, { fontSize: size * 0.15 }]}>HEALTH</Text>
    </View>
  )

  const SystemCard: React.FC<{
    title: string
    report: SystemReport
    icon: string
  }> = ({ title, report, icon }) => (
    <View style={styles.systemCard}>
      <View style={styles.systemHeader}>
        <View style={styles.systemTitleRow}>
          <Text style={styles.systemIcon}>{icon}</Text>
          <Text style={styles.systemTitle}>{title}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(report?.status) }]}>
          <Text style={styles.statusText}>{report?.status}</Text>
        </View>
      </View>

      <View style={styles.systemContent}>
        <View style={styles.scoreRow}>
          <HealthScoreCircle score={report?.healthScore ?? 0} size={60} />
          <View style={styles.systemDetails}>
            <Text style={styles.checkedBy}>Checked by: {report?.checkedBy ?? '-'}</Text>

            {Array.isArray(report?.issues) && report.issues.length > 0 && (
              <View style={styles.issueSection}>
                <Text style={styles.sectionTitle}>Issues Found:</Text>
                {report.issues.map((issue, index) => (
                  <Text key={index} style={styles.issueItem}>
                    • {issue}
                  </Text>
                ))}
              </View>
            )}
          </View>
        </View>

        {Array.isArray(report?.repairableItems) && report.repairableItems.length > 0 && (
          <View style={styles.actionSection}>
            <Text style={styles.actionTitle}>🔧 Repairable:</Text>
            {report.repairableItems.map((item, index) => (
              <Text key={index} style={styles.actionItem}>
                • {item}
              </Text>
            ))}
          </View>
        )}

        {Array.isArray(report?.replacementItems) && report.replacementItems.length > 0 && (
          <View style={styles.actionSection}>
            <Text style={styles.actionTitle}>🔄 Replacement:</Text>
            {report.replacementItems.map((item, index) => (
              <Text key={index} style={styles.actionItem}>
                • {item}
              </Text>
            ))}
          </View>
        )}

        {Array.isArray(report?.recommendations) && report.recommendations.length > 0 && (
          <View style={styles.recommendationSection}>
            <Text style={styles.recommendationTitle}>💡 Recommendations:</Text>
            {report.recommendations.map((rec, index) => (
              <Text key={index} style={styles.recommendationItem}>
                • {rec}
              </Text>
            ))}
          </View>
        )}
      </View>
    </View>
  )

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => onBack ? onBack() : router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#2563EB" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Vehicle Health Report</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Generating health report...</Text>
        </View>
      </SafeAreaView>
    );
  }
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => onBack ? onBack() : router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#2563EB" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Vehicle Health Report</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }
  if (!healthReport) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1F2937" />

      {/* Header with back button, matching details_4.1 */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => onBack ? onBack() : router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#2563EB" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vehicle Health Report</Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Vehicle Information */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Vehicle Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Vehicle Number:</Text>
              <Text style={styles.infoValue}>{healthReport.vehicleInfo.vehicleNumber}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Vehicle Type:</Text>
              <Text style={styles.infoValue}>{healthReport.vehicleInfo.vehicleType}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Driver:</Text>
              <Text style={styles.infoValue}>{healthReport.vehicleInfo.driverName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Kilometers:</Text>
              <Text style={styles.infoValue}>{healthReport.vehicleInfo.kilometers}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Maintenance Date:</Text>
              <Text style={styles.infoValue}>{healthReport.vehicleInfo.maintenanceDate}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Total Time:</Text>
              <Text style={styles.infoValue}>{healthReport.vehicleInfo.totalMaintenanceTime}</Text>
            </View>
          </View>
        </View>

        {/* Overall Health */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Overall Health Assessment</Text>
          <View style={styles.overallHealthCard}>
            <View style={styles.overallHealthHeader}>
              <HealthScoreCircle score={healthReport.overallHealth.score} />
              <View style={styles.overallHealthInfo}>
                <View
                  style={[styles.overallStatusBadge, { backgroundColor: getStatusColor(healthReport.overallHealth.status) }]}
                >
                  <Text style={styles.overallStatusText}>{healthReport.overallHealth.status}</Text>
                </View>
                <Text style={styles.overallSummary}>{healthReport.overallHealth.summary}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* System Reports */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>System Analysis</Text>

          <SystemCard title="Mechanical System" report={healthReport.systemReports.mechanical} icon="⚙️" />

          <SystemCard title="Electrical System" report={healthReport.systemReports.electrical} icon="⚡" />

          <SystemCard title="Body Structure" report={healthReport.systemReports.body} icon="🚗" />

          <SystemCard title="Tyre System" report={healthReport.systemReports.tyre} icon="🛞" />
        </View>

        {/* Priority Recommendations */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Priority Recommendations</Text>
          <View style={styles.recommendationsCard}>
            {healthReport.recommendations.map((recommendation, index) => (
              <View key={index} style={styles.priorityRecommendation}>
                <Text style={styles.priorityNumber}>{index + 1}</Text>
                <Text style={styles.priorityText}>{recommendation}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Next Service */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Next Service Due</Text>
          <View style={styles.serviceCard}>
            <View style={styles.serviceRow}>
              <Text style={styles.serviceLabel}>Kilometers:</Text>
              <Text style={styles.serviceValue}>{healthReport.nextServiceDue.kilometers}</Text>
            </View>
            <View style={styles.serviceRow}>
              <Text style={styles.serviceLabel}>Estimated Date:</Text>
              <Text style={styles.serviceValue}>{healthReport.nextServiceDue.estimatedDate}</Text>
            </View>
            <View style={[styles.priorityBadge, { backgroundColor: getStatusColor(healthReport.nextServiceDue.priority) }]}>
              <Text style={styles.priorityBadgeText}>{healthReport.nextServiceDue.priority} Priority</Text>
            </View>
          </View>
        </View>

        {/* AI Insights */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>AI Insights</Text>
          <View style={styles.insightsCard}>
            <Text style={styles.insightsIcon}>🤖</Text>
            <Text style={styles.insightsText}>{healthReport.aiInsights}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Report generated on {new Date().toLocaleDateString()}</Text>
          <Text style={styles.footerSubtext}>Powered by Gemini AI</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
  },
  backButtonText: {
    color: '#2563EB',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
    textAlign: 'center',
  },
  headerSpacer: {
    width: 80,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  infoLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 14,
    color: "#1F2937",
    fontWeight: "600",
  },
  overallHealthCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  overallHealthHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  overallHealthInfo: {
    flex: 1,
    marginLeft: 20,
  },
  overallStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  overallStatusText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  overallSummary: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 20,
  },
  scoreCircle: {
    backgroundColor: "#F3F4F6",
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#E5E7EB",
  },
  scoreText: {
    fontWeight: "bold",
    color: "#1F2937",
  },
  scoreLabel: {
    color: "#6B7280",
    fontWeight: "500",
  },
  systemCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  systemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  systemTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  systemIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  systemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  systemContent: {
    padding: 16,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  systemDetails: {
    flex: 1,
    marginLeft: 16,
  },
  checkedBy: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 8,
  },
  issueSection: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#EF4444",
    marginBottom: 4,
  },
  issueItem: {
    fontSize: 12,
    color: "#7F1D1D",
    marginBottom: 2,
  },
  actionSection: {
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  actionItem: {
    fontSize: 12,
    color: "#4B5563",
    marginBottom: 2,
  },
  recommendationSection: {
    backgroundColor: "#FEF3C7",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  recommendationTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#92400E",
    marginBottom: 4,
  },
  recommendationItem: {
    fontSize: 12,
    color: "#92400E",
    marginBottom: 2,
  },
  recommendationsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  priorityRecommendation: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  priorityNumber: {
    backgroundColor: "#EF4444",
    color: "#FFFFFF",
    width: 24,
    height: 24,
    borderRadius: 12,
    textAlign: "center",
    lineHeight: 24,
    fontSize: 12,
    fontWeight: "600",
    marginRight: 12,
  },
  priorityText: {
    flex: 1,
    fontSize: 14,
    color: "#1F2937",
    lineHeight: 20,
  },
  serviceCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  serviceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  serviceLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  serviceValue: {
    fontSize: 14,
    color: "#1F2937",
    fontWeight: "600",
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginTop: 8,
  },
  priorityBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  insightsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: "center",
  },
  insightsIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  insightsText: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 20,
    textAlign: "center",
  },
  footer: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  footerText: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 10,
    color: "#9CA3AF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#374151",
  },
})

export default VehicleHealthReport
