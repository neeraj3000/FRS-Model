import Sidebar from "../parts/Charts";
import Charts from "../parts/Sidebar";

function Admin(){
    return(
        <div>
        <h1  style={{ paddingTop: '100px', textAlign: 'center' }}>Student Attendance Charts</h1>
            <Charts />
            <Sidebar/>
        </div>
    )
}
export default Admin;