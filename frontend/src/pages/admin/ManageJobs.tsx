

import JobList from '../../components/admin/JobList';

const ManageJobs = () => {
    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>Manage Jobs</h1>
                    <p className="subtitle">View and filter all posted jobs across the platform</p>
                </div>
            </div>

            <div className="card">
                <JobList />
            </div>
        </div>
    );
};

export default ManageJobs;
