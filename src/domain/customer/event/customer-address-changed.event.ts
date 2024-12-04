import EventInterface from "../../@shared/event/event.interface";
import Customer from "../entity/customer";

export default class CustomerAddressChangedEvent implements EventInterface {
    dataTimeOccurred: Date;
    eventData: { id: string; name: string; address: string };

    
    constructor (eventData: any) {
        this.dataTimeOccurred = new Date();
        this.eventData = eventData;
    }
}