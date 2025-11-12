import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Header from "../components/header";
import BottomNavBar from "../components/bottomNavBar";
import OrganizationBar from "../components/organizationBar";
import OrganizationCard from "../components/organizationCard";
import { getApprovedOrganizations } from "../Backend/organizationHandler";
import { checkAppliedOrganization } from "../Backend/organizationHandler";
import { useEffect } from "react";
import Ionicons from "react-native-vector-icons/Ionicons";
import * as DocumentPicker from "expo-document-picker";
import { updateOrganizationDocuments } from "../Backend/organizationHandler";
import { auth, firestore } from "../Firebase";
import { getDoc, doc } from "firebase/firestore";

export default function OrganizationPage() {
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const orgs = await getApprovedOrganizations();
        setOrganizations(orgs);
      } catch (error) {
        console.error("Error fetching organizations:", error);
      }
    };

    fetchOrganizations();
  }, []);

  useEffect(() => {
    const loadCurrentUserProfile = async () => {
      try {
        const user = auth.currentUser;
        if (!user?.email) return;
        const userRef = doc(firestore, "Users", user.email);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setCurrentUserProfile(userSnap.data());
        }
      } catch (error) {
        console.error("Error fetching current user profile:", error);
      }
    };

    loadCurrentUserProfile();
  }, []);

  const navigation = useNavigation();
  const [scrollY, setScrollY] = useState(0);
  const [organizations, setOrganizations] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("All");
  const [showRequirementsModal, setShowRequirementsModal] = useState(false);
  const [showReaccreditationModal, setShowReaccreditationModal] =
    useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [recommendedOrganizations, setRecommendedOrganizations] = useState([]);

  const documentStatusList = [
    { key: "constitutionByLaws", label: "Constitution & By-Laws" },
    { key: "atoApplication", label: "Application for ATO" },
    { key: "officersList", label: "Officers List" },
    { key: "gpoa", label: "General Plan of Action (GPOA)" },
    { key: "registrationForm", label: "Registration Form" },
  ];

  const getOrganizationTitle = () => {
    switch (selectedDepartment) {
      case "All":
        return "All Organizations";
      case "CSC":
        return "Central Student Council";
      case "COE":
        return "College of Engineering";
      case "CAS":
        return "College of Arts and Sciences";
      case "CFAD":
        return "College of Fine Arts and Design";
      case "CBA":
        return "College Business Administration";
      default:
        return "";
    }
  };

  const requirements = [
    {
      title: "Minimum Members",
      description: "At least 15 active student members",
    },
    {
      title: "Constitution & By-Laws",
      description:
        "A complete organizational constitution and by-laws document",
    },
    {
      title: "Faculty Adviser",
      description: "Must have at least one faculty adviser from the university",
    },
    {
      title: "Application for ATO",
      description:
        "Complete list of officers with their respective positions and student IDs",
    },
    {
      title: "Officers List",
      description:
        "Complete list of officers with their respective positions and student IDs",
    },
    {
      title: "General Plans of Action (GPOA)",
      description: "Proposed plans and programs for the academic year",
    },
    {
      title: "Registration Form",
      description: "Completed official student organization registration form",
    },
  ];

  const reaccreditationRequirements = [
    {
      title: "Accomplishment Report",
      description:
        "Detailed report of activities and achievements from the previous academic year",
    },
    {
      title: "Financial Report",
      description:
        "Complete financial statements including income and expenses",
    },
    {
      title: "Evaluation of Activities",
      description:
        "Assessment and feedback on all conducted activities and events",
    },
    {
      title: "Nomination of Adviser",
      description: "Nomination letter for the organization's faculty adviser",
    },
    {
      title: "Application for ATO",
      description:
        "Updated application for Authority to Operate for the current academic year",
    },
    {
      title: "Evaluation of Adviser",
      description: "Performance evaluation of the current faculty adviser",
    },
    {
      title: "Proposed Plans and Programs",
      description:
        "Planned activities and programs for the upcoming academic year",
    },
  ];

  const handleRegisterNavigation = () => {
    setShowRequirementsModal(false);
    navigation.navigate("RegisterOrganization");
  };

  const handleReaccreditationNavigation = () => {
    setShowReaccreditationModal(false);
    navigation.navigate("ReaccreditOrganization");
  };

  const normalizeValue = (value) =>
    typeof value === "string" ? value.trim().toLowerCase() : "";

  useEffect(() => {
    if (!currentUserProfile || organizations.length === 0) {
      setRecommendedOrganizations([]);
      return;
    }

    const userCourse = normalizeValue(
      currentUserProfile.Course || currentUserProfile.course
    );
    const userDepartment = normalizeValue(
      currentUserProfile.department || currentUserProfile.Department
    );
    const userInterests = Array.isArray(currentUserProfile.interests)
      ? currentUserProfile.interests
          .map((interest) => normalizeValue(interest))
          .filter(Boolean)
      : [];

    const scoredOrganizations = organizations
      .filter((org) => org.status === "approved")
      .map((org) => {
        let score = 0;

        const canJoin = Array.isArray(org.canJoin) ? org.canJoin : [];
        if (canJoin.length > 0) {
          const matchesCourse =
            userCourse &&
            canJoin.some(
              (course) => normalizeValue(course) === userCourse
            );
          if (matchesCourse) {
            score += 4;
          } else if (userCourse) {
            return null;
          }
        }

        const orgDepartment = normalizeValue(org.department || org.college);
        if (orgDepartment && userDepartment && orgDepartment === userDepartment) {
          score += 2;
        }

        const orgTags = Array.isArray(org.tags)
          ? org.tags.map((tag) => normalizeValue(tag)).filter(Boolean)
          : [];
        if (orgTags.length && userInterests.length) {
          const overlap = orgTags.filter((tag) => userInterests.includes(tag));
          score += overlap.length;
        }

        const followerCount = Array.isArray(org.followers)
          ? org.followers.length
          : 0;
        score += Math.min(followerCount, 50) * 0.02;

        return { org, score };
      })
      .filter(Boolean)
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((item) => item.org);

    setRecommendedOrganizations(scoredOrganizations);
  }, [organizations, currentUserProfile]);

  const [pendingOrg, setPendingOrg] = useState(null);
  const [reuploadDocuments, setReuploadDocuments] = useState({});

  const pickReuploadFile = async (docKey) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return; // User canceled

      const file = result.assets[0];

      setReuploadDocuments((prev) => ({
        ...prev,
        [docKey]: {
          uri: file.uri,
          name: file.name,
          size: file.size,
          mimeType: file.mimeType || "application/pdf",
        },
      }));
    } catch (error) {
      console.log("Document Pick Error:", error);
    }
  };

  const removeReuploadFile = (docKey) => {
    setReuploadDocuments((prev) => ({
      ...prev,
      [docKey]: null,
    }));
  };
  const handleReuploadSubmit = async () => {
    try {
      await updateOrganizationDocuments(pendingOrg.id, reuploadDocuments);
      Alert.alert(
        "Success",
        "Documents updated. They will now be re-reviewed."
      );
      setReuploadDocuments({});
    } catch (error) {
      Alert.alert("Update failed", "Please try again.");
    }
  };

  useEffect(() => {
    const fetchPending = async () => {
      const result = await checkAppliedOrganization();
      setPendingOrg(result);
    };
    fetchPending();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <Header scrollY={scrollY} />
        <ScrollView
          onScroll={(event) => {
            setScrollY(event.nativeEvent.contentOffset.y);
          }}
          scrollEventThrottle={16}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <OrganizationBar onSelectDepartment={setSelectedDepartment} />

          <View style={styles.titleContainer}>
            <Text style={styles.titleText}>{getOrganizationTitle()}</Text>
            <View style={styles.underline} />
          </View>

        {recommendedOrganizations.length > 0 && (
          <View style={styles.recommendedSection}>
            <View style={styles.recommendedHeader}>
              <Ionicons name="star" size={18} color="#E50914" />
              <Text style={styles.recommendedTitle}>Recommended For You</Text>
            </View>
            {recommendedOrganizations.map((org) => (
              <OrganizationCard
                key={`recommended-${org.id}`}
                orgName={org.orgName}
                memberCount={Array.isArray(org.members) ? org.members.length : 0}
                shortdesc={org.shortdesc}
                logo={org.logoBase64 || null}
              />
            ))}
          </View>
        )}

          {organizations
            .filter(
              (org) =>
                org.status === "approved" && // Only show approved orgs
                (selectedDepartment === "All" ||
                  org.department === selectedDepartment)
            )
            .map((org) => {
              return (
                <OrganizationCard
                  key={org.id}
                  orgName={org.orgName}
                  memberCount={org.members.length}
                  shortdesc={org.shortdesc}
                  logo={org.logoBase64 || null}
                />
              );
            })}

          {/* Pending Application Section */}
          {pendingOrg && (
            <View style={styles.pendingSection}>
              {/* Main Status Card */}
              <View
                style={[
                  styles.statusCard,
                  {
                    borderColor: (() => {
                      const configs = {
                        applied: "#1E88E5",
                        approved: "#34A853",
                        rejected: "#E50914",
                        hold: "#F4A100",
                        terminated: "#B0B0B0",
                      };
                      return configs[pendingOrg.status] || "#1E88E5";
                    })(),
                    backgroundColor: (() => {
                      const configs = {
                        applied: "#E3F2FD",
                        approved: "#E6F9ED",
                        rejected: "#FFE6E6",
                        hold: "#FFF9E6",
                        terminated: "#F2F2F2",
                      };
                      return configs[pendingOrg.status] || "#E3F2FD";
                    })(),
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusTitle,
                    {
                      color: (() => {
                        const configs = {
                          applied: "#1E88E5",
                          approved: "#34A853",
                          rejected: "#E50914",
                          hold: "#F4A100",
                          terminated: "#6D6D6D",
                        };
                        return configs[pendingOrg.status] || "#1E88E5";
                      })(),
                    },
                  ]}
                >
                  {pendingOrg.status === "applied" &&
                    "Application Under Review"}
                  {pendingOrg.status === "approved" && "Application Approved"}
                  {pendingOrg.status === "rejected" && "Application Rejected"}
                  {pendingOrg.status === "hold" && "Organization On Hold"}
                  {pendingOrg.status === "terminated" &&
                    "Organization Terminated"}
                </Text>

                <Text style={styles.statusMessage}>
                  Your application for{" "}
                  <Text style={styles.boldText}>{pendingOrg.acronym}</Text>
                  {pendingOrg.status === "applied" &&
                    " is currently being reviewed by the student council."}
                  {pendingOrg.status === "approved" &&
                    " has been approved! You can now access your organization dashboard."}
                  {pendingOrg.status === "rejected" &&
                    " was rejected. Please review the remarks below and resubmit with corrections."}
                  {pendingOrg.status === "hold" &&
                    " is temporarily on hold. Please wait for further instructions from the council."}
                  {pendingOrg.status === "terminated" &&
                    " has been terminated by the administration."}
                </Text>

                {/* ✅ Add This */}
                {pendingOrg.reviewNotes && (
                  <Text
                    style={[
                      styles.statusMessage,
                      { marginTop: 12, fontStyle: "italic" },
                    ]}
                  >
                    Remarks: {pendingOrg.reviewNotes}
                  </Text>
                )}
              </View>

              {/* Overall Remarks Card
                            <View style={styles.remarksCard}>
                                <View style={styles.remarksHeader}>
                                    <Text style={styles.remarksHeaderText}>📋 Overall Remarks</Text>
                                </View>
                                <Text style={styles.remarksText}>
                                    {pendingOrg.overallRemarks || "No overall remarks yet."}
                                </Text>
                            </View> */}

              {/* Document Status Card */}
              <View style={styles.documentsCard}>
                <View style={styles.documentsHeader}>
                  <Text style={styles.documentsHeaderText}>
                    Document Status
                  </Text>
                </View>

                {documentStatusList.map((doc, index) => {
                  const status = pendingOrg?.[`${doc.key}Status`] ?? "pending";
                  const remarks = pendingOrg?.[`${doc.key}Remarks`] ?? "";
                  const uploadedFile = reuploadDocuments?.[doc.key];

                  return (
                    <View key={index} style={styles.documentItem}>
                      <View style={styles.documentHeader}>
                        <Text style={styles.documentTitle}>{doc.label}</Text>

                        <View
                          style={[
                            styles.statusBadge,
                            {
                              backgroundColor:
                                status === "approved"
                                  ? "#E6F9ED"
                                  : status === "rejected"
                                  ? "#FFE6E6"
                                  : status === "pending"
                                  ? "#FFF9E6"
                                  : "#E0E0E0",
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusBadgeText,
                              {
                                color:
                                  status === "approved"
                                    ? "#34A853"
                                    : status === "rejected"
                                    ? "#E50914"
                                    : status === "pending"
                                    ? "#F4A100"
                                    : "#555",
                              },
                            ]}
                          >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </Text>
                        </View>
                      </View>

                      {remarks ? (
                        <Text style={styles.documentRemarks}>
                          Remarks: {remarks}
                        </Text>
                      ) : null}

                      {/* ✅ Upload only if status is applied / rejected / hold */}
                      {["applied", "rejected", "hold"].includes(
                        pendingOrg.status
                      ) && (
                        <View style={{ marginTop: 10 }}>
                          {uploadedFile ? (
                            <View style={styles.uploadedRow}>
                              <Text style={styles.fileNameText}>
                                {uploadedFile.name}
                              </Text>
                              <TouchableOpacity
                                onPress={() => removeReuploadFile(doc.key)}
                              >
                                <Text
                                  style={{
                                    color: "#E50914",
                                    fontWeight: "700",
                                  }}
                                >
                                  Remove
                                </Text>
                              </TouchableOpacity>
                            </View>
                          ) : (
                            <TouchableOpacity
                              style={styles.reuploadButton}
                              onPress={() => pickReuploadFile(doc.key)}
                            >
                              <Text style={styles.reuploadButtonText}>
                                Upload File
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      )}
                    </View>
                  );
                })}

                {["applied", "rejected", "hold"].includes(
                  pendingOrg.status
                ) && (
                  <TouchableOpacity
                    style={styles.saveReuploadButton}
                    onPress={handleReuploadSubmit}
                  >
                    <Text style={styles.saveReuploadButtonText}>
                      Save Documents
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Resubmit Button for Rejected Applications */}
              {pendingOrg.status === "rejected" && (
                <TouchableOpacity
                  style={styles.resubmitButton}
                  onPress={() => navigation.navigate("RegisterOrganization")}
                >
                  <Text style={styles.resubmitButtonText}>
                    Resubmit Application
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Registration Section */}
          {(!pendingOrg || pendingOrg.status === "rejected") && (
            <View style={styles.registerSection}>
              <View style={styles.registerCard}>
                <Text style={styles.registerTitle}>
                  Start Your Own Organization
                </Text>
                <Text style={styles.registerSubtitle}>
                  Have an idea for a new student organization?
                </Text>
                <TouchableOpacity
                  style={styles.requirementsButton}
                  onPress={() => setShowRequirementsModal(true)}
                >
                  <Text style={styles.requirementsButtonText}>
                    View Registration Requirements
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Reaccreditation Section */}
              <View style={[styles.registerCard, styles.reaccreditCard]}>
                <Text style={styles.reaccredTitle}>Existing Organization?</Text>
                <Text style={styles.registerSubtitle}>
                  Keep your organization active with annual reaccreditation
                </Text>
                <TouchableOpacity
                  style={[styles.requirementsButton, styles.reaccreditButton]}
                  onPress={() => setShowReaccreditationModal(true)}
                >
                  <Text style={styles.requirementsButtonText}>
                    View Reaccreditation Requirements
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Requirements Modal */}
        <Modal
          visible={showRequirementsModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowRequirementsModal(false)}
        >
          <View style={styles.modalBackground}>
            <View style={styles.modalContainer}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                style={styles.modalScroll}
              >
                <Text style={styles.modalTitle}>
                  Organization Registration Requirements
                </Text>
                <Text style={styles.modalSubtitle}>
                  Please ensure you meet all the following requirements before
                  proceeding:
                </Text>

                {requirements.map((req, index) => (
                  <View key={index} style={styles.requirementItem}>
                    <View style={styles.requirementNumber}>
                      <Text style={styles.requirementNumberText}>
                        {index + 1}
                      </Text>
                    </View>
                    <View style={styles.requirementContent}>
                      <Text style={styles.requirementTitle}>{req.title}</Text>
                      <Text style={styles.requirementDescription}>
                        {req.description}
                      </Text>
                    </View>
                  </View>
                ))}

                <View style={styles.noteContainer}>
                  <Text style={styles.noteText}>
                    Note: The registration process may take 2-4 weeks for review
                    and approval.
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.registerButton}
                  onPress={handleRegisterNavigation}
                >
                  <Text style={styles.registerButtonText}>
                    Proceed to Register
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowRequirementsModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Reaccreditation Modal */}
        <Modal
          visible={showReaccreditationModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowReaccreditationModal(false)}
        >
          <View style={styles.modalBackground}>
            <View style={styles.modalContainer}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                style={styles.modalScroll}
              >
                <Text style={styles.modalTitle}>
                  Organization Reaccreditation Requirements
                </Text>
                <Text style={styles.modalSubtitle}>
                  Submit the following documents for annual reaccreditation:
                </Text>

                {reaccreditationRequirements.map((req, index) => (
                  <View key={index} style={styles.requirementItem}>
                    <View
                      style={[
                        styles.requirementNumber,
                        styles.reaccreditNumber,
                      ]}
                    >
                      <Text style={styles.requirementNumberText}>
                        {index + 1}
                      </Text>
                    </View>
                    <View style={styles.requirementContent}>
                      <Text style={styles.requirementTitle}>{req.title}</Text>
                      <Text style={styles.requirementDescription}>
                        {req.description}
                      </Text>
                    </View>
                  </View>
                ))}

                <View style={[styles.noteContainer, styles.reaccreditNote]}>
                  <Text style={styles.noteText}>
                    Note: Reaccreditation must be completed before the start of
                    each academic year to maintain active status.
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.registerButton, styles.reaccreditButtonStyle]}
                  onPress={handleReaccreditationNavigation}
                >
                  <Text style={styles.registerButtonText}>
                    Proceed to Reaccreditation
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowReaccreditationModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>

        <BottomNavBar />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  titleContainer: {
    marginTop: 15,
    marginHorizontal: 20,
    marginBottom: 15,
  },
  titleText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#E50914",
    textAlign: "center",
  },
  recommendedSection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  recommendedHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  recommendedTitle: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "600",
    color: "#E50914",
  },
  underline: {
    alignSelf: "center",
    height: 2,
    backgroundColor: "#E50914",
    width: "100%",
    marginTop: 2,
  },
  // Pending Section Styles
  pendingSection: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  statusCard: {
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  statusMessage: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
  boldText: {
    fontWeight: "bold",
    color: "#333",
  },
  remarksCard: {
    backgroundColor: "#FFF9E6",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#FFB800",
  },
  remarksHeader: {
    marginBottom: 8,
  },
  remarksHeaderText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#8B6E00",
  },
  remarksText: {
    fontSize: 14,
    color: "#5C4A00",
    lineHeight: 20,
  },
  documentsCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  documentsHeader: {
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    paddingBottom: 12,
    marginBottom: 16,
  },
  documentsHeaderText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  documentItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  documentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  documentTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  documentRemarks: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
    fontStyle: "italic",
  },
  noDocumentsText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    fontStyle: "italic",
  },
  resubmitButton: {
    backgroundColor: "#E50914",
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  resubmitButtonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 16,
  },
  // Registration Section Styles
  registerSection: {
    marginTop: 30,
    marginHorizontal: 0,
    marginBottom: 20,
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: "#E50914",
    paddingTop: 20,
    marginHorizontal: 20,
  },
  registerCard: {
    backgroundColor: "#FFF5F5",
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: "#FFE0E0",
    alignItems: "center",
    marginTop: 10,
  },
  reaccreditCard: {
    backgroundColor: "#F0F8FF",
    borderColor: "#D0E8FF",
  },
  registerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#E50914",
    marginBottom: 8,
    textAlign: "center",
  },
  reaccredTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1E88E5",
    marginBottom: 8,
    textAlign: "center",
  },
  registerSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
  },
  requirementsButton: {
    backgroundColor: "#E50914",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  reaccreditButton: {
    backgroundColor: "#1E88E5",
  },
  requirementsButtonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },
  // Modal Styles
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    maxHeight: "85%",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalScroll: {
    flexGrow: 1,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
    color: "#E50914",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  requirementItem: {
    flexDirection: "row",
    marginBottom: 20,
    alignItems: "flex-start",
  },
  requirementNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E50914",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  requirementNumberText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
  requirementContent: {
    flex: 1,
    paddingTop: 2,
  },
  requirementTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  requirementDescription: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
  },
  noteContainer: {
    backgroundColor: "#FFF9E6",
    borderLeftWidth: 4,
    borderLeftColor: "#FFB800",
    padding: 12,
    borderRadius: 6,
    marginTop: 10,
    marginBottom: 20,
  },
  noteText: {
    fontSize: 13,
    color: "#8B6E00",
    lineHeight: 18,
  },
  registerButton: {
    backgroundColor: "#E50914",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  registerButtonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 16,
  },
  cancelButton: {
    padding: 12,
    marginBottom: 10,
  },
  cancelButtonText: {
    textAlign: "center",
    color: "#E50914",
    fontSize: 15,
    fontWeight: "600",
  },

  reuploadSection: {
    marginTop: 20,
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#ddd",
  },
  reuploadTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#E50914",
    marginBottom: 6,
  },
  reuploadSubtitle: {
    fontSize: 13,
    color: "#666",
    marginBottom: 16,
  },
  reuploadCard: {
    marginBottom: 12,
  },
  reuploadLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    color: "#333",
  },
  reuploadButton: {
    borderWidth: 1,
    borderColor: "#E50914",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  reuploadButtonText: {
    color: "#E50914",
    fontWeight: "600",
    fontSize: 14,
  },
  uploadedRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FFF0",
    borderWidth: 1,
    borderColor: "#C8E6C9",
    borderRadius: 8,
    padding: 10,
  },
  fileNameText: {
    flex: 1,
    color: "#333",
  },
  removeFileButton: {
    marginLeft: 6,
  },
  saveReuploadButton: {
    backgroundColor: "#E50914",
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 20,
    alignItems: "center",
  },
  saveReuploadButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
