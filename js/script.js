 // ==================== GLOBAL VARIABLES ====================
        let currentMonth = new Date().getMonth();
        let currentYear = new Date().getFullYear();
        let currentEditElementId = null;
        let currentEditMeeting = null;
        let isEditingMeeting = false;

        // ==================== LOADING FUNCTIONS ====================
        function hideLoading() {
            const loadingElement = document.getElementById('loading');
            if (loadingElement) {
                loadingElement.classList.add('hidden');
            }
        }

        function showLoading() {
            const loadingElement = document.getElementById('loading');
            if (loadingElement) {
                loadingElement.classList.remove('hidden');
            }
        }

        // ==================== INITIALIZATION ====================
        document.addEventListener('DOMContentLoaded', function() {
            // Hide loading screen after 1 second
            setTimeout(hideLoading, 1000);
            
            // Initialize calendar and counters
            renderCalendar(currentMonth, currentYear);
            animateCounters();
            
            // Set up event listeners
            setupEventListeners();
            
            // Initialize mobile menu button
            const mobileMenuBtn = document.getElementById('mobileMenuBtn');
            if (mobileMenuBtn) {
                mobileMenuBtn.addEventListener('click', toggleMobileSidebar);
            }
        });

        function setupEventListeners() {
            // Login form
            const loginForm = document.getElementById('loginForm');
            if (loginForm) {
                loginForm.addEventListener('submit', handleLogin);
            }
            
            // Payroll form
            const payrollForm = document.getElementById('payrollForm');
            if (payrollForm) {
                payrollForm.addEventListener('submit', handlePayrollSubmit);
            }
            
            // Sidebar items
            document.querySelectorAll('.sidebar-item').forEach(item => {
                item.addEventListener('click', function() {
                    const pageName = this.getAttribute('data-page');
                    if (pageName) {
                        showPage(pageName);
                    }
                });
            });
        }

        // ==================== LOGIN HANDLING ====================
        function handleLogin(e) {
            e.preventDefault();
            showLoading();
            
            setTimeout(() => {
                document.getElementById('loginPage').style.display = 'none';
                document.getElementById('dashboard').classList.add('active');
                hideLoading();
            }, 1500);
        }

        // ==================== PAGE NAVIGATION ====================
        function showPage(pageName) {
            showLoading();
            
            // Hide all pages first
            document.querySelectorAll('.page').forEach(page => {
                page.classList.add('hidden');
            });
            
            // Update active sidebar item
            document.querySelectorAll('.sidebar-item').forEach(item => {
                item.classList.remove('active');
            });
            
            // Find and activate the clicked sidebar item
            const activeItem = document.querySelector(`.sidebar-item[data-page="${pageName}"]`);
            if (activeItem) {
                activeItem.classList.add('active');
            }
            
            // Show the requested page
            const pageMap = {
                'overview': 'overviewPage',
                'payroll': 'payrollPage',
                'payslip': 'payslipPage'
            };
            
            const pageToShow = document.getElementById(pageMap[pageName]);
            if (pageToShow) {
                // Special handling for payslip page
                if (pageName === 'payslip') {
                    loadPayslipData();
                }
                
                pageToShow.classList.remove('hidden');
            }
            
            // Always hide loading after operation
            setTimeout(hideLoading, 500);
        }

        // ==================== EDIT MODAL FUNCTIONS ====================
        function openEditModal(title, elementId, event) {
            // Stop event propagation to prevent card click event
            if (event) {
                event.stopPropagation();
            }
            
            const modal = document.getElementById('editModal');
            const modalTitle = document.getElementById('modalTitle');
            const modalLabel = document.getElementById('modalLabel');
            const modalInput = document.getElementById('modalInput');
            
            // Set modal content
            modalTitle.textContent = `Edit ${title}`;
            modalLabel.textContent = title;
            
            // Get current value
            const currentValue = document.getElementById(elementId).textContent;
            modalInput.value = currentValue;
            
            // Store which element we're editing
            currentEditElementId = elementId;
            
            // Show modal
            modal.classList.add('active');
        }

        function closeEditModal() {
            const modal = document.getElementById('editModal');
            modal.classList.remove('active');
            currentEditElementId = null;
        }

        function saveEditedValue() {
            if (!currentEditElementId) return;
            
            const modalInput = document.getElementById('modalInput');
            const newValue = modalInput.value;
            
            // Update the value
            document.getElementById(currentEditElementId).textContent = newValue;
            
            // Close modal
            closeEditModal();
            
            // Show success message
            showAlert('Value updated successfully');
        }

        // ==================== MEETING MODAL FUNCTIONS ====================
        function openMeetingModal(meetingElement = null) {
            const modal = document.getElementById('meetingModal');
            const titleInput = document.getElementById('meetingTitleInput');
            const timeInput = document.getElementById('meetingTimeInput');
            const dateInput = document.getElementById('meetingDateInput');
            
            if (meetingElement) {
                // Editing existing meeting
                isEditingMeeting = true;
                currentEditMeeting = meetingElement;
                
                const meetingTime = meetingElement.querySelector('.meeting-time').textContent;
                const meetingDate = meetingElement.querySelector('.meeting-date').textContent;
                
                // Extract time and title
                const timeMatch = meetingTime.match(/(\d{1,2}:\d{2}\s[AP]m)$/i);
                const title = meetingTime.replace(timeMatch ? timeMatch[0] : '', '').trim();
                
                titleInput.value = title;
                timeInput.value = timeMatch ? convertTo24Hour(timeMatch[0]) : '';
                
                // Parse date (assuming format like "Wed May 17")
                const dateParts = meetingDate.split(' ');
                if (dateParts.length >= 3) {
                    const monthName = dateParts[1];
                    const day = dateParts[2];
                    const month = new Date(`${monthName} 1, ${currentYear}`).getMonth();
                    const date = new Date(currentYear, month, day);
                    dateInput.valueAsDate = date;
                }
            } else {
                // Adding new meeting
                isEditingMeeting = false;
                currentEditMeeting = null;
                
                // Clear inputs
                titleInput.value = '';
                timeInput.value = '';
                dateInput.valueAsDate = new Date();
            }
            
            modal.classList.add('active');
        }

        function closeMeetingModal() {
            const modal = document.getElementById('meetingModal');
            modal.classList.remove('active');
            currentEditMeeting = null;
            isEditingMeeting = false;
        }

        function saveMeeting() {
            const titleInput = document.getElementById('meetingTitleInput');
            const timeInput = document.getElementById('meetingTimeInput');
            const dateInput = document.getElementById('meetingDateInput');
            
            if (!titleInput.value || !timeInput.value || !dateInput.value) {
                showAlert('Please fill all fields');
                return;
            }
            
            const timeString = convertTo12Hour(timeInput.value);
            const date = new Date(dateInput.value);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            const monthName = date.toLocaleDateString('en-US', { month: 'short' });
            const dayNumber = date.getDate();
            
            const formattedDate = `${dayName} ${monthName} ${dayNumber}`;
            
            if (isEditingMeeting && currentEditMeeting) {
                // Update existing meeting
                currentEditMeeting.querySelector('.meeting-time').textContent = `${titleInput.value} - ${timeString}`;
                currentEditMeeting.querySelector('.meeting-date').textContent = formattedDate;
            } else {
                // Create new meeting
                const meetingsList = document.getElementById('meetingsList');
                const newMeeting = document.createElement('div');
                newMeeting.className = 'meeting-item';
                newMeeting.onclick = function() { animateMeeting(this); };
                newMeeting.innerHTML = `
                    <div class="meeting-content">
                        <div class="meeting-time">${titleInput.value} - ${timeString}</div>
                        <div class="meeting-date">${formattedDate}</div>
                    </div>
                    <button class="meeting-edit-btn" onclick="editMeeting(this.parentElement, event)">
                        <i class="fas fa-pencil-alt"></i>
                    </button>
                `;
                meetingsList.prepend(newMeeting);
            }
            
            closeMeetingModal();
            showAlert('Meeting saved successfully');
        }

        function editMeeting(meetingElement, event) {
            event.stopPropagation();
            openMeetingModal(meetingElement);
        }

        // Helper function to convert 24-hour time to 12-hour format
        function convertTo12Hour(time24) {
            const [hours, minutes] = time24.split(':');
            const period = hours >= 12 ? 'Pm' : 'Am';
            const hours12 = hours % 12 || 12;
            return `${hours12}:${minutes} ${period}`;
        }

        // Helper function to convert 12-hour time to 24-hour format
        function convertTo24Hour(time12) {
            const [time, period] = time12.split(' ');
            let [hours, minutes] = time.split(':');
            
            if (period.toLowerCase() === 'pm' && hours !== '12') {
                hours = parseInt(hours, 10) + 12;
            } else if (period.toLowerCase() === 'am' && hours === '12') {
                hours = '00';
            }
            
            return `${hours}:${minutes}`;
        }

        // ==================== PAYROLL FUNCTIONS ====================
        function handlePayrollSubmit(e) {
            e.preventDefault();
            showLoading();
            
            const payrollData = {};
            document.querySelectorAll('#payrollForm .form-input-field').forEach(input => {
                const label = input.previousElementSibling.textContent.trim();
                payrollData[label] = input.value;
            });
            
            try {
                localStorage.setItem("lastPayroll", JSON.stringify(payrollData));
                showAlert('Payroll submitted successfully');
            } catch (error) {
                console.error("Error saving payroll data:", error);
                showAlert('Error saving payroll data');
            } finally {
                hideLoading();
            }
        }

        function clearForm() {
            document.getElementById('payrollForm').reset();
        }

        // ==================== PAYSLIP FUNCTIONS ====================
        function loadPayslipData() {
            showLoading();
            
            try {
                const payrollData = JSON.parse(localStorage.getItem("lastPayroll"));
                
                if (!payrollData) {
                    showAlert('No payroll data found. Please submit payroll first.');
                    return;
                }
                
                // Update employee information
                updateElementText("#payslipPage .info-item:nth-child(1) span:last-child", payrollData["Employee Name"]);
                updateElementText("#payslipPage .info-item:nth-child(2) span:last-child", payrollData["Employee ID"]);
                updateElementText("#payslipPage .info-item:nth-child(3) span:last-child", payrollData["Employee Role"]);
                
                // Update payslip table
                updateElementHTML(".payslip-table tbody td:nth-child(1) div:nth-child(1)", 
                                `<strong>Employee ID:</strong> ${payrollData["Employee ID"] || 'N/A'}`);
                updateElementHTML(".payslip-table tbody td:nth-child(1) div:nth-child(2)", 
                                `<strong>Employee Name:</strong> ${payrollData["Employee Name"] || 'N/A'}`);
                updateElementHTML(".payslip-table tbody td:nth-child(2)", 
                                `<div><strong>Basic Salary:</strong> ${payrollData["Basic Salary"] || '0'}</div>
                                 <div><strong>Total Salary:</strong> ${payrollData["Total Salary"] || '0'}</div>`);
                
                updateElementText(".payslip-table tbody td:nth-child(3)", payrollData["Additions"] || '0');
                updateElementText(".payslip-table tbody td:nth-child(4)", payrollData["Deductions"] || '0');
                
                // Calculate and display total earnings
                const basicSalary = parseFloat(payrollData["Basic Salary"]) || 0;
                const additions = parseFloat(payrollData["Additions"]) || 0;
                const deductions = parseFloat(payrollData["Deductions"]) || 0;
                const totalEarnings = basicSalary + additions - deductions;
                
                updateElementText(".total-earnings", `Total Earnings: ₹ ${totalEarnings.toLocaleString()}`);
                
            } catch (error) {
                console.error("Error loading payslip data:", error);
                showAlert('Error loading payslip data');
            } finally {
                hideLoading();
            }
        }

        function updateElementText(selector, text) {
            const element = document.querySelector(selector);
            if (element) {
                element.textContent = text;
            }
        }

        function updateElementHTML(selector, html) {
            const element = document.querySelector(selector);
            if (element) {
                element.innerHTML = html;
            }
        }

        async function downloadPayslip() {
            showLoading();
            
            try {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF({
                    orientation: "portrait",
                    unit: "mm",
                    format: "a4"
                });
                
                const payslipElement = document.querySelector('.payslip-container');
                
                // Generate PDF using html2canvas
                const canvas = await html2canvas(payslipElement, {
                    scale: 2,
                    logging: false,
                    useCORS: true
                });
                
                const imgData = canvas.toDataURL('image/png');
                const imgWidth = doc.internal.pageSize.getWidth() - 20;
                const imgHeight = (canvas.height * imgWidth) / canvas.width;
                
                doc.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
                doc.save('payslip.pdf');
                
                showAlert('Payslip downloaded successfully');
            } catch (error) {
                console.error("Error generating PDF:", error);
                showAlert('Error downloading payslip');
            } finally {
                hideLoading();
            }
        }

        function savePayslip() {
            showAlert('Payslip saved successfully');
        }

        // ==================== HELPER FUNCTIONS ====================
        function showAlert(message) {
            const existingAlert = document.querySelector('.custom-alert');
            if (existingAlert) {
                existingAlert.remove();
            }
            
            const alertDiv = document.createElement('div');
            alertDiv.className = 'custom-alert';
            alertDiv.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, #fbbf24, #f59e0b);
                color: white;
                padding: 15px 25px;
                border-radius: 12px;
                box-shadow: 0 10px 30px rgba(251, 191, 36, 0.3);
                z-index: 10000;
                animation: slideInRight 0.5s ease-out;
                max-width: 300px;
                font-weight: 600;
            `;
            alertDiv.textContent = message;
            
            document.body.appendChild(alertDiv);
            
            setTimeout(() => {
                alertDiv.style.animation = 'slideInRight 0.5s ease-out reverse';
                setTimeout(() => alertDiv.remove(), 500);
            }, 3000);
        }

        // ==================== CALENDAR FUNCTIONS ====================
        function renderCalendar(month, year) {
            const monthNames = ["January", "February", "March", "April", "May", "June", 
                               "July", "August", "September", "October", "November", "December"];
            
            // Update month/year display
            document.getElementById('currentMonthYear').textContent = `${monthNames[month]} ${year}`;
            
            const firstDay = new Date(year, month).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const today = new Date();
            
            let tableHTML = "<tr><th>Sun</th><th>Mon</th><th>Tue</th><th>Wed</th><th>Thu</th><th>Fri</th><th>Sat</th></tr><tr>";
            let date = 1;
            
            for (let i = 0; i < 6; i++) {
                for (let j = 0; j < 7; j++) {
                    if (i === 0 && j < firstDay) {
                        tableHTML += "<td></td>";
                    } else if (date > daysInMonth) {
                        break;
                    } else {
                        const isToday = date === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                        tableHTML += `<td ${isToday ? 'class="today"' : ''}>${date}</td>`;
                        date++;
                    }
                }
                tableHTML += "</tr>";
            }
            
            document.getElementById('calendarTable').innerHTML = tableHTML;
        }

        function previousMonth() {
            currentMonth--;
            if (currentMonth < 0) {
                currentMonth = 11;
                currentYear--;
            }
            renderCalendar(currentMonth, currentYear);
        }

        function nextMonth() {
            currentMonth++;
            if (currentMonth > 11) {
                currentMonth = 0;
                currentYear++;
            }
            renderCalendar(currentMonth, currentYear);
        }

        // ==================== ANIMATIONS ====================
        function animateCounters() {
            const counters = [
                { id: 'totalEmployees', target: 156 },
                { id: 'totalLeave', target: 23 },
                { id: 'newEmployees', target: 8 },
                { id: 'holidays', target: 12 }
            ];
            
            counters.forEach(counter => {
                const element = document.getElementById(counter.id);
                if (!element) return;
                
                let current = 0;
                const increment = counter.target / 50;
                const timer = setInterval(() => {
                    current += increment;
                    if (current >= counter.target) {
                        current = counter.target;
                        clearInterval(timer);
                    }
                    element.textContent = Math.floor(current);
                }, 50);
            });
        }

        function animateCard(card) {
            if (!card) return;
            
            card.style.transform = 'scale(0.95)';
            setTimeout(() => {
                card.style.transform = 'scale(1.02)';
                setTimeout(() => { card.style.transform = ''; }, 200);
            }, 100);
        }

        function animateMeeting(meeting) {
            if (!meeting) return;
            
            meeting.style.background = 'rgba(251, 191, 36, 0.3)';
            meeting.style.transform = 'translateX(15px) scale(1.02)';
            setTimeout(() => {
                meeting.style.background = '';
                meeting.style.transform = '';
            }, 300);
        }

        // ==================== MOBILE SIDEBAR ====================
        function toggleMobileSidebar() {
            const sidebar = document.getElementById('sidebar');
            if (sidebar) {
                sidebar.classList.toggle('mobile-open');
            }
        }