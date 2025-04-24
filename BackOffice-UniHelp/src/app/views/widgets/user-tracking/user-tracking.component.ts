import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Chart, registerables } from 'chart.js';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  CardModule,
  GridModule,
  TableModule,
  BadgeModule,
  ButtonModule,
  FormModule
} from '@coreui/angular';

Chart.register(...registerables);

interface UserActivity {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  userRole: string;
  activityType: string;
  timestamp: string;
  ipAddress: string;
  deviceType: string;
  browserName: string;
  osName: string;
  screenResolution: string;
  timezone: string;
  language: string;
  visitorId: string;
  userAgent: string;
  referrer: string;
  country: string;
  city: string;
  sessionId: string;
  successful: boolean;
  failureReason: string;
}

interface DashboardStats {
  recentLogins: number;
  deviceDistribution: Record<string, number>;
  browserDistribution: Record<string, number>;
  osDistribution: Record<string, number>;
}

@Component({
  selector: 'app-user-tracking',
  templateUrl: './user-tracking.component.html',
  styleUrls: ['./user-tracking.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
    CardModule,
    GridModule,
    TableModule,
    BadgeModule,
    ButtonModule,
    FormModule
  ]
})
export class UserTrackingComponent implements OnInit {
  public activities: UserActivity[] = [];
  public filteredActivities: UserActivity[] = [];
  public allActivities: UserActivity[] = [];
  public stats: DashboardStats | null = null;
  public loading = true;
  public error = '';
  public deviceChart: Chart | null = null;
  public browserChart: Chart | null = null;
  public osChart: Chart | null = null;
  public selectedActivityType = 'all';
  
  // Filter properties
  public selectedUserId: string | null = null;
  public searchTerm: string = '';
  public startDate: string = '';
  public endDate: string = '';
  public deviceTypeFilter: string = '';
  
  // Helper methods for the template
  getUniqueDeviceCount(): number {
    if (this.stats?.deviceDistribution) {
      return Object.keys(this.stats.deviceDistribution).length;
    }
    return 0;
  }
  
  getDesktopCount(): number {
    if (this.stats?.deviceDistribution) {
      return this.stats.deviceDistribution['Desktop'] || 0;
    }
    return 0;
  }
  
  getMobileCount(): number {
    if (this.stats?.deviceDistribution) {
      return this.stats.deviceDistribution['Mobile'] || 0;
    }
    return 0;
  }
  
  private readonly API_URL = `http://localhost:8888/USER/api/auth/user-activity`;
  private readonly COLORS = [
    'rgba(54, 162, 235, 0.6)',
    'rgba(255, 99, 132, 0.6)',
    'rgba(255, 206, 86, 0.6)',
    'rgba(75, 192, 192, 0.6)',
    'rgba(153, 102, 255, 0.6)',
    'rgba(255, 159, 64, 0.6)',
    'rgba(199, 199, 199, 0.6)'
  ];

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.loadDashboardStats();
    this.loadRecentActivities();
  }

  loadDashboardStats(): void {
    this.http.get<DashboardStats>(`${this.API_URL}/dashboard-stats`)
      .subscribe({
        next: (stats) => {
          this.stats = stats;
          this.renderCharts();
        },
        error: (err) => {
          console.error('Failed to load dashboard stats', err);
          this.error = 'Failed to load stats. Please try again later.';
          this.loading = false;
        }
      });
  }

  loadRecentActivities(activityType: string = 'all'): void {
    this.loading = true;
    let url;
    
    if (activityType === 'all') {
      // Format dates as ISO strings without milliseconds to match Java LocalDateTime parsing
      const startDate = this.getLastMonthDateString();
      const endDate = this.getCurrentDateString();
      url = `${this.API_URL}/date-range?startDate=${startDate}&endDate=${endDate}`;
      console.log('Requesting user activities with URL:', url);
    } else {
      url = `${this.API_URL}/type/${activityType}`;
    }

    this.http.get<UserActivity[]>(url)
      .subscribe({
        next: (activities) => {
          this.activities = activities;
          this.allActivities = [...activities]; // Keep a copy of all activities for filtering
          this.filteredActivities = [...activities]; // Initialize filtered activities
          this.loading = false;
        },
        error: (err) => {
          console.error('Failed to load user activities', err);
          this.error = 'Failed to load activities. Please try again later.';
          this.loading = false;
        }
      });
  }

  onActivityTypeChange(): void {
    this.loadRecentActivities(this.selectedActivityType);
  }

  private renderCharts(): void {
    if (!this.stats) return;
    
    // Destroy existing charts if they exist
    if (this.deviceChart) this.deviceChart.destroy();
    if (this.browserChart) this.browserChart.destroy();
    if (this.osChart) this.osChart.destroy();
    
    // Create device distribution chart
    this.createChart('deviceChart', 'Device Distribution', this.stats.deviceDistribution);
    
    // Create browser distribution chart
    this.createChart('browserChart', 'Browser Distribution', this.stats.browserDistribution);
    
    // Create OS distribution chart
    this.createChart('osChart', 'OS Distribution', this.stats.osDistribution);
  }

  private createChart(canvasId: string, title: string, data: Record<string, number>): void {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) return;
    
    const labels = Object.keys(data);
    const values = Object.values(data);
    
    const chart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: values,
          backgroundColor: this.COLORS.slice(0, labels.length),
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'right',
          },
          title: {
            display: true,
            text: title
          }
        }
      }
    });
    
    if (canvasId === 'deviceChart') this.deviceChart = chart;
    else if (canvasId === 'browserChart') this.browserChart = chart;
    else if (canvasId === 'osChart') this.osChart = chart;
  }
  
  formatDate(timestamp: string): string {
    return new Date(timestamp).toLocaleString();
  }
  
  private getCurrentDateString(): string {
    // Format as ISO string that Java's LocalDateTime can parse
    const now = new Date();
    return now.toISOString().slice(0, 19); // Remove milliseconds
  }
  
  private getLastMonthDateString(): string {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().slice(0, 19); // Remove milliseconds
  }
  
  /**
   * Filter activities based on user selection
   */
  public applyFilters(): void {
    console.log('Applying filters');
    this.filteredActivities = this.allActivities.filter(activity => {
      // Filter by selected user
      if (this.selectedUserId && activity.userId.toString() !== this.selectedUserId) {
        return false;
      }
      
      // Filter by search term (check username, email, or IP)
      if (this.searchTerm) {
        const searchLower = this.searchTerm.toLowerCase();
        const nameMatch = activity.userName?.toLowerCase().includes(searchLower) || false;
        const emailMatch = activity.userEmail?.toLowerCase().includes(searchLower) || false;
        const ipMatch = activity.ipAddress?.toLowerCase().includes(searchLower) || false;
        
        if (!nameMatch && !emailMatch && !ipMatch) {
          return false;
        }
      }
      
      // Filter by date range
      if (this.startDate) {
        const activityDate = new Date(activity.timestamp);
        const startDate = new Date(this.startDate);
        startDate.setHours(0, 0, 0, 0); // Start of day
        
        if (activityDate < startDate) {
          return false;
        }
      }
      
      if (this.endDate) {
        const activityDate = new Date(activity.timestamp);
        const endDate = new Date(this.endDate);
        endDate.setHours(23, 59, 59, 999); // End of day
        
        if (activityDate > endDate) {
          return false;
        }
      }
      
      // Filter by device type
      if (this.deviceTypeFilter && activity.deviceType !== this.deviceTypeFilter) {
        return false;
      }
      
      return true;
    });
    
    this.activities = this.filteredActivities;
  }
  
  /**
   * Reset all filters to default values
   */
  public resetFilters(): void {
    this.selectedUserId = null;
    this.searchTerm = '';
    this.startDate = '';
    this.endDate = '';
    this.deviceTypeFilter = '';
    this.activities = [...this.allActivities];
  }
  
  /**
   * Clear all stored data
   */
  public clearData(): void {
    if (confirm('Are you sure you want to clear all user tracking data? This cannot be undone.')) {
      // Clear from local storage if any
      localStorage.removeItem('unihelp_login_events');
      
      // Clear in-memory data
      this.activities = [];
      this.filteredActivities = [];
      this.allActivities = [];
      
      // Optionally, you can also make an API call to clear data on the server
      // this.http.delete(`${this.API_URL}/clear-all`).subscribe(...)
    }
  }
}
