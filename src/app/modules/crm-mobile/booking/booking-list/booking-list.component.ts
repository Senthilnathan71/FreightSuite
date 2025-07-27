import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';

@Component({
  selector: 'app-booking-list',
  standalone: true,
  imports: [
    CommonModule,
    NgbDropdownModule,
    FormsModule,
    FavoriteStarComponent
  ],
  templateUrl: './booking-list.component.html',
  styleUrl: './booking-list.component.scss'
})
export class BookingListComponent {

  
  searchValue: any
  filterValue : string = ''
  bookingList: any
  departmentList: any
  searchPerformed : boolean;
  constructor(private router: Router ) { }

  // ngOnInit() {
  //   this.getAllBooking()
  // }

  // getAllDepartment() {
  //   this.bookingService.getAllDepartment().subscribe({
  //     next: (data) => {
  //       this.departmentList = data;
  //     }
  //   });
  // }


  // getAllBooking() {
  //   this.bookingService.getAllBooking().subscribe({
  //     next: (data) => {
  //       this.bookingList = data;
  //       this.getAllDepartment()
  //     }
  //   });
  // }
  // getDepartmentName(sid: number): string {
  //   if (!this.departmentList) return 'Loading...';

  //   const dept = this.departmentList.find(
  //     (d: { DepartmentMasterSid: number }) => d.DepartmentMasterSid === sid
  //   );

  //   return dept ? dept.departmentName : 'N/A';
  // }


  // trackByBookingId(index: number, item: any): number {
  //   return item.BookingHeaderSid;
  // }

  // handleCardAction(item: any) {
  //   this.router.navigate([`/booking/view/${item.BookingHeaderSid}`]);
  // }


  // isEditable(eta: string | Date, etd: string | Date): boolean {
  //   if (!eta || !etd) return false;

  //   const etaDate = new Date(eta);
  //   const etdDate = new Date(etd);

  //   // Calculate the difference in days from ETD to ETA
  //   const diffInMs = etaDate.getTime() - etdDate.getTime();
  //   const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

  //   return diffInDays >= 3; // Editable only if ETD is 3 or more days before ETA
  // }


  // search() {
  //   if (!this.searchValue || this.searchValue.trim() === "") {
  //     this.getAllBooking(); // Call to fetch all booking data
  //   } else {
  //     this.bookingList = this.bookingList.filter(item =>
  //       item.POL === this.searchValue ||
  //       item.POD === this.searchValue ||
  //       item.ETA === this.searchValue ||
  //       item.ETD === this.searchValue ||
  //       item.BookingNo === this.searchValue
  //     );
  //   }
  // }



  // goBack() {
  //   history.back()
  // }

  // goToCreateBooking() {
  //   this.router.navigate(['booking/view']);
  // }


 bookingLis = [
  {
    BookingId: 1,
    BookingNo: 'BK-20250724-001',
    DepartmentMasterSid: 101,
    POL: 'Chennai, IN',
    POD: 'Singapore, SG',
    ETA: new Date('2025-07-30T10:00:00'),
    ETD: new Date('2025-08-02T14:00:00')
  },
  {
    BookingId: 2,
    BookingNo: 'BK-20250724-002',
    DepartmentMasterSid: 102,
    POL: 'Mumbai, IN',
    POD: 'Dubai, AE',
    ETA: new Date('2025-07-29T16:00:00'),
    ETD: new Date('2025-08-03T11:00:00')
  },
  {
    BookingId: 3,
    BookingNo: 'BK-20250724-003',
    DepartmentMasterSid: 103,
    POL: 'Cochin, IN',
    POD: 'Hamburg, DE',
    ETA: new Date('2025-08-01T08:00:00'),
    ETD: new Date('2025-08-05T17:00:00')
  }
];

getDepartmentName(id: number): string {
  const map = {
    101: 'Export',
    102: 'Import',
    103: 'Transshipment'
  };
  return map[id] || 'Unknown';
}

trackByBookingId(index: number, item: any) {
  return item.BookingId;
}

searchBooking(){

}

resetPage(){
  
}

report(){

}

clearFilterValue(){
  
}


goBack(){
  history.back()
}

goToCreateBooking(){
  this.router.navigate(['crm/booking/entry'])
}


}
