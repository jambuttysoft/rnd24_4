import React from 'react';
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy - Jamutty Smart AI Email Engine',
  description: 'Privacy Policy for Jamutty Smart AI Email Engine - How we collect, use, and protect your data when using Google services integration.'
}

const PrivacyPolicyPage = () => {
    return (
        <div className='max-w-7xl mx-auto py-12 px-8'>
            <>
                <div className="max-w-5xl px-8 mx-auto sm:mt-10">
                    <h1 className="text-center text-3xl sm:text-6xl font-semibold text-gray-700 mb-2">
                        Privacy Policy
                    </h1>
                    <h2 className="text-center text-gray-600 mb-20">
                        Last updated {new Date().toLocaleDateString()}
                    </h2>
                    <h3 className="text-left text-2xl font-semibold text-gray-600 mb-5">
                        Introduction
                    </h3>
                    <p className="text-justify leading-relaxed text-gray-600 mt-5 mb-10">
                        Jamutty Smart AI Email Engine ("we," "our," or "us") operates the jamutty.com website and provides 
                        an AI-powered email management service. This Privacy Policy explains how we collect, use, disclose, 
                        and safeguard your information when you use our service, particularly in relation to Google services integration.
                    </p>
                    <h3 className="text-left text-2xl font-semibold text-gray-600 mb-5">
                        Information We Collect
                    </h3>
                    <h4 className="text-left text-xl font-medium text-gray-600 mb-3">
                        Google Account Information
                    </h4>
                    <p className="text-justify leading-relaxed text-gray-600 mt-5 mb-5">
                        When you connect your Google account to our service, we may access and collect:
                    </p>
                    <ul className="list-disc list-inside text-justify leading-relaxed text-gray-600 mt-5 mb-10">
                        <li><strong>Gmail Data:</strong> Email messages, labels, threads, and metadata for email management and AI processing</li>
                        <li><strong>Google Calendar:</strong> Calendar events, schedules, and meeting information for intelligent scheduling</li>
                        <li><strong>Google Contacts:</strong> Contact information for email suggestions and relationship mapping</li>
                        <li><strong>Google Tasks:</strong> Task lists and items for productivity integration</li>
                        <li><strong>Profile Information:</strong> Basic profile data including name, email address, and profile picture</li>
                    </ul>
                    <h4 className="text-left text-xl font-medium text-gray-600 mb-3">
                        Usage Information
                    </h4>
                    <ul className="list-disc list-inside text-justify leading-relaxed text-gray-600 mt-5 mb-10">
                        <li>Application usage patterns and feature interactions</li>
                        <li>Email processing preferences and AI model interactions</li>
                        <li>Performance metrics and error logs</li>
                    </ul>
                    <h4 className="text-left text-xl font-medium text-gray-600 mb-3">
                        Technical Information
                    </h4>
                    <ul className="list-disc list-inside text-justify leading-relaxed text-gray-600 mt-5 mb-10">
                        <li>IP address and device information</li>
                        <li>Browser type and version</li>
                        <li>Operating system information</li>
                    </ul>
                    <h3 className="text-left text-2xl font-semibold text-gray-600 mb-5">
                        How We Use Your Information
                    </h3>
                    <p className="text-justify leading-relaxed text-gray-600 mt-5 mb-5">
                        We use the collected information for the following purposes:
                    </p>
                    <ul className="list-disc list-inside text-justify leading-relaxed text-gray-600 mt-5 mb-10">
                        <li><strong>Email Management:</strong> Organize, categorize, and provide intelligent insights about your emails</li>
                        <li><strong>AI Processing:</strong> Train and improve our AI models to provide better email suggestions and automation</li>
                        <li><strong>Calendar Integration:</strong> Suggest meeting times and manage scheduling conflicts</li>
                        <li><strong>Contact Management:</strong> Provide intelligent contact suggestions and relationship insights</li>
                        <li><strong>Task Management:</strong> Integrate email actions with your task management workflow</li>
                        <li><strong>Service Improvement:</strong> Analyze usage patterns to enhance our service features</li>
                        <li><strong>Security:</strong> Detect and prevent fraudulent or unauthorized access</li>
                    </ul>
                    <h3 className="text-left text-2xl font-semibold text-gray-600 mb-5">
                        Google API Services Compliance
                    </h3>
                    <p className="text-justify leading-relaxed text-gray-600 mt-5 mb-10">
                        Our use of information received from Google APIs adheres to the 
                        <a href="https://developers.google.com/terms/api-services-user-data-policy" 
                           className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                          Google API Services User Data Policy
                        </a>, including the Limited Use requirements.
                    </p>
                    <h4 className="text-left text-xl font-medium text-gray-600 mb-3">
                        Limited Use Disclosure
                    </h4>
                    <p className="text-justify leading-relaxed text-gray-600 mt-5 mb-10">
                        Jamutty Smart AI Email Engine's use and transfer of information received from Google APIs to any other app will adhere to 
                        <a href="https://developers.google.com/terms/api-services-user-data-policy#additional_requirements_for_specific_api_scopes" 
                           className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                          Google API Services User Data Policy
                        </a>, including the Limited Use requirements.
                    </p>
                    <h4 className="text-left text-xl font-medium text-gray-600 mb-3">
                        Requested Permissions
                    </h4>
                    <p className="text-justify leading-relaxed text-gray-600 mt-5 mb-5">
                        We request the following Google API scopes:
                    </p>
                    <ul className="list-disc list-inside text-justify leading-relaxed text-gray-600 mt-5 mb-10">
                        <li><code>https://www.googleapis.com/auth/gmail.readonly</code> - Read your email messages</li>
                        <li><code>https://www.googleapis.com/auth/gmail.modify</code> - Manage your email</li>
                        <li><code>https://www.googleapis.com/auth/gmail.compose</code> - Compose emails</li>
                        <li><code>https://www.googleapis.com/auth/gmail.send</code> - Send emails on your behalf</li>
                        <li><code>https://www.googleapis.com/auth/calendar.readonly</code> - View your calendar</li>
                        <li><code>https://www.googleapis.com/auth/calendar</code> - Manage your calendar</li>
                        <li><code>https://www.googleapis.com/auth/contacts.readonly</code> - View your contacts</li>
                        <li><code>https://www.googleapis.com/auth/contacts</code> - Manage your contacts</li>
                        <li><code>https://www.googleapis.com/auth/tasks.readonly</code> - View your tasks</li>
                        <li><code>https://www.googleapis.com/auth/tasks</code> - Manage your tasks</li>
                    </ul>
                    <h3 className="text-left text-2xl font-semibold text-gray-600 mb-5">
                        Data Sharing and Disclosure
                    </h3>
                    <p className="text-justify leading-relaxed text-gray-600 mt-5 mb-5">
                        We do not sell, trade, or otherwise transfer your personal information to third parties except in the following circumstances:
                    </p>
                    <ul className="list-disc list-inside text-justify leading-relaxed text-gray-600 mt-5 mb-5">
                        <li><strong>Service Providers:</strong> Trusted third-party services that assist in operating our application (e.g., cloud hosting, analytics)</li>
                        <li><strong>Legal Requirements:</strong> When required by law, court order, or government regulation</li>
                        <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
                        <li><strong>Consent:</strong> When you explicitly consent to the sharing</li>
                    </ul>
                    <p className="text-justify leading-relaxed text-gray-600 mt-5 mb-10">
                        <strong>Important:</strong> We never share your Google account data with third parties for advertising or marketing purposes.
                    </p>
                    
                    <h3 className="text-left text-2xl font-semibold text-gray-600 mb-5">
                        Data Security
                    </h3>
                    <p className="text-justify leading-relaxed text-gray-600 mt-5 mb-5">
                        We implement appropriate technical and organizational security measures to protect your information:
                    </p>
                    <ul className="list-disc list-inside text-justify leading-relaxed text-gray-600 mt-5 mb-10">
                        <li>Encryption of data in transit and at rest</li>
                        <li>Regular security audits and vulnerability assessments</li>
                        <li>Access controls and authentication mechanisms</li>
                        <li>Secure data centers with physical security measures</li>
                        <li>Regular backup and disaster recovery procedures</li>
                    </ul>
                    
                    <h3 className="text-left text-2xl font-semibold text-gray-600 mb-5">
                        Data Retention
                    </h3>
                    <p className="text-justify leading-relaxed text-gray-600 mt-5 mb-5">
                        We retain your information for as long as necessary to provide our services and fulfill the purposes outlined in this policy:
                    </p>
                    <ul className="list-disc list-inside text-justify leading-relaxed text-gray-600 mt-5 mb-10">
                        <li><strong>Google Account Data:</strong> Retained while your account is active and for up to 30 days after account deletion</li>
                        <li><strong>Usage Data:</strong> Retained for up to 2 years for service improvement purposes</li>
                        <li><strong>Legal Requirements:</strong> Some data may be retained longer if required by law</li>
                    </ul>
                    
                    <h3 className="text-left text-2xl font-semibold text-gray-600 mb-5">
                        Third-Party Services
                    </h3>
                    <p className="text-justify leading-relaxed text-gray-600 mt-5 mb-5">
                        Our service integrates with various third-party services:
                    </p>
                    <ul className="list-disc list-inside text-justify leading-relaxed text-gray-600 mt-5 mb-5">
                        <li><strong>Google Services:</strong> Gmail, Calendar, Contacts, Tasks (covered by Google's Privacy Policy)</li>
                        <li><strong>Authentication:</strong> Clerk for user authentication</li>
                        <li><strong>AI Services:</strong> OpenAI for AI processing capabilities</li>
                        <li><strong>Analytics:</strong> Usage analytics for service improvement</li>
                    </ul>
                    <p className="text-justify leading-relaxed text-gray-600 mt-5 mb-10">
                        Each third-party service has its own privacy policy, and we encourage you to review them.
                    </p>
                    
                    <h3 className="text-left text-2xl font-semibold text-gray-600 mb-5">
                        International Data Transfers
                    </h3>
                    <p className="text-justify leading-relaxed text-gray-600 mt-5 mb-10">
                        Your information may be transferred to and processed in countries other than your country of residence. 
                        We ensure appropriate safeguards are in place to protect your information in accordance with applicable data protection laws.
                    </p>
                    
                    <h3 className="text-left text-2xl font-semibold text-gray-600 mb-5">
                        Children's Privacy
                    </h3>
                    <p className="text-justify leading-relaxed text-gray-600 mt-5 mb-10">
                        Our service is not intended for children under the age of 13. We do not knowingly collect personal information 
                        from children under 13. If we become aware that we have collected personal information from a child under 13, 
                        we will take steps to delete such information.
                    </p>
                    <h3 className="text-left text-2xl font-semibold text-gray-600 mb-5">
                        Not covered by this Privacy Statement
                    </h3>
                    <p className="text-justify leading-relaxed text-gray-600 mt-5 mb-10">
                        This Privacy Statement does not apply to job applicants and candidates
                        who apply for employment with us or to our employees and non-employee workers. It also does not apply to the
                        personal information that we process on behalf of our customers, as a processor or service provider. Our customers
                        are the controller (or “business”) for the personal information that we process on their behalf.
                    </p>
                    <h3 className="text-left text-2xl font-semibold text-gray-600 mb-5">
                        Sharing Personal Information
                    </h3>
                    <p className="text-justify leading-relaxed text-gray-600 mt-5 mb-10">
                        We may share your personal information internally and externally with suppliers, advisors, or Business Partners for
                        Normal Human’s legitimate business purposes, and only on a need-to-know basis. When sharing personal information,
                        we implement appropriate checks and controls to confirm that the information can be shared in accordance with the
                        applicable law. This section describes how we share information and how we facilitate that sharing.
                    </p>
                    <h3 className="text-left text-2xl font-semibold text-gray-600 mb-5">
                        Information Security and Retention
                    </h3>
                    <p className="text-justify leading-relaxed text-gray-600 mt-5 mb-10">
                        To protect your personal information from unauthorized access, use, and disclosure, we implement reasonable
                        physical, administrative, and technical safeguards. These safeguards include role-based access controls and
                        encryption to keep personal information private while in transit. We only retain personal information as long as
                        necessary to fulfill the purposes for which it is processed, or to comply with legal and regulatory retention
                        requirements. Legal and regulatory retention requirements may include retaining information for:
                    </p>
                    <ul className="list-disc list-inside text-justify leading-relaxed text-gray-600 mt-5 mb-10">
                        <li>audit and accounting purposes,</li>
                        <li>statutory retention terms,</li>
                        <li>the handling of disputes,</li>
                        <li>and the establishment, exercise, or defense of legal claims in the countries where we do business.</li>
                    </ul>
                    <h3 className="text-left text-2xl font-semibold text-gray-600 mb-5">
                        Your Rights and Choices
                    </h3>
                    <p className="text-justify leading-relaxed text-gray-600 mt-5 mb-5">
                        You have the following rights regarding your personal information:
                    </p>
                    <ul className="list-disc list-inside text-justify leading-relaxed text-gray-600 mt-5 mb-10">
                        <li><strong>Access:</strong> Request access to your personal information</li>
                        <li><strong>Correction:</strong> Request correction of inaccurate information</li>
                        <li><strong>Deletion:</strong> Request deletion of your personal information</li>
                        <li><strong>Portability:</strong> Request a copy of your data in a portable format</li>
                        <li><strong>Revoke Consent:</strong> Disconnect your Google account at any time through your account settings</li>
                        <li><strong>Opt-out:</strong> Opt-out of certain data processing activities</li>
                    </ul>
                    <h3 className="text-left text-2xl font-semibold text-gray-600 mb-5">
                        Changes to This Privacy Policy
                    </h3>
                    <p className="text-justify leading-relaxed text-gray-600 mt-5 mb-10">
                        We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new 
                        Privacy Policy on this page and updating the "Effective Date" at the top. We encourage you to review this 
                        Privacy Policy periodically for any changes.
                    </p>
                    
                    <h3 className="text-left text-2xl font-semibold text-gray-600 mb-5">
                        Contact Us
                    </h3>
                    <p className="text-justify leading-relaxed text-gray-600 mt-5 mb-5">
                        If you have any questions about this Privacy Policy or our data practices, please contact us at:
                    </p>
                    <div className="bg-gray-50 p-4 rounded-lg mt-4 mb-10">
                        <p><strong>Email:</strong> privacy@jamutty.com</p>
                        <p><strong>Website:</strong> jamutty.com</p>
                        <p><strong>Address:</strong> [Your Business Address]</p>
                    </div>
                    
                    <h3 className="text-left text-2xl font-semibold text-gray-600 mb-5">
                        Google API Verification
                    </h3>
                    <p className="text-justify leading-relaxed text-gray-600 mt-5 mb-10">
                        This application has been reviewed and verified by Google for compliance with their API policies. 
                        Our application undergoes regular security assessments to ensure the protection of your data.
                    </p>
                </div>
            </>
        </div>
    );
};

export default PrivacyPolicyPage;
