import Issue from '../models/Issue.js';
import User from '../models/User.js'; // สำหรับ populate ข้อมูล reportedBy, resolvedBy
import mongoose from 'mongoose';

// @desc    แจ้งปัญหาปิดหลุม (ใช้ได้ทั้ง Caddy และ Starter)
// @route   POST /api/issues/report-hole-closure
// @access  Private (Caddy, Starter, Admin)
export const reportHoleClosure = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { holeNumber, description } = req.body;
        const reportedBy = req.user.id; // ผู้ใช้ที่ล็อกอินอยู่

        if (!holeNumber || !description) {
            return res.status(400).json({ success: false, message: 'Please provide hole number and description.' });
        }
        if (holeNumber < 1 || holeNumber > 18) {
            return res.status(400).json({ success: false, message: 'Hole number must be between 1 and 18.' });
        }

        // สร้าง Issue ใหม่
        const issue = await Issue.create([{
            holeNumber,
            issueType: 'hole_closure_report',
            description,
            status: 'reported',
            reportedBy
        }], { session });

        // TODO: (Optional) อัปเดตสถานะของ Hole Model ที่เกี่ยวข้อง ถ้ามี Hole Model
        // await Hole.findOneAndUpdate({ holeNumber }, { status: 'closed' }, { session });

        await session.commitTransaction();
        res.status(201).json({ success: true, data: issue[0] });

    } catch (error) {
        await session.abortTransaction();
        console.error(error); // เพื่อดู Error ใน Console
        res.status(500).json({ success: false, message: 'Error reporting hole closure.', error: error.message });
    } finally {
        session.endSession();
    }
};

// @desc    สตาร์ทเตอร์แจ้งกำลังแก้ไขปัญหาหลุม
// @route   PUT /api/issues/:issueId/mark-in-progress
// @access  Private (Starter, Admin)
export const markIssueInProgress = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { issueId } = req.params;
        const { personInCharge } = req.body;
        const resolvedBy = req.user.id; // ผู้ใช้ที่ล็อกอินอยู่ (สตาร์ทเตอร์/แอดมิน)

        if (!personInCharge) {
            return res.status(400).json({ success: false, message: 'Please provide the name of the person in charge.' });
        }

        const issue = await Issue.findById(issueId).session(session);

        if (!issue) {
            return res.status(404).json({ success: false, message: 'Issue not found.' });
        }

        // ตรวจสอบให้แน่ใจว่าเป็นปัญหาที่สามารถดำเนินการได้ (เช่น ยังเป็น reported)
        if (issue.issueType !== 'hole_closure_report' || issue.status !== 'reported') {
            return res.status(400).json({ success: false, message: 'This issue cannot be marked as in progress.' });
        }

        issue.status = 'in_progress';
        issue.personInCharge = personInCharge;
        issue.resolvedBy = resolvedBy; // ผู้ที่เริ่มดำเนินการแก้ไข
        await issue.save({ session });

        // TODO: (Optional) อัปเดตสถานะของ Hole Model เป็น 'under_maintenance'
        // await Hole.findOneAndUpdate({ holeNumber: issue.holeNumber }, { status: 'under_maintenance' }, { session });

        await session.commitTransaction();
        res.status(200).json({ success: true, data: issue });

    } catch (error) {
        await session.abortTransaction();
        console.error(error);
        res.status(500).json({ success: false, message: 'Error marking issue in progress.', error: error.message });
    } finally {
        session.endSession();
    }
};


// @desc    สตาร์ทเตอร์แจ้งแก้ไขสำเร็จ / เปิดหลุม
// @route   PUT /api/issues/:issueId/mark-resolved
// @access  Private (Starter, Admin)
export const markIssueResolved = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { issueId } = req.params;
        const resolvedBy = req.user.id; // ผู้ใช้ที่ล็อกอินอยู่ (สตาร์ทเตอร์/แอดมิน)

        const issue = await Issue.findById(issueId).session(session);

        if (!issue) {
            return res.status(404).json({ success: false, message: 'Issue not found.' });
        }

        // ตรวจสอบให้แน่ใจว่าเป็นปัญหาที่สามารถแก้ไขได้ (เช่น อยู่ในสถานะ reported หรือ in_progress)
        if (issue.issueType !== 'hole_closure_report' || (issue.status !== 'reported' && issue.status !== 'in_progress')) {
            return res.status(400).json({ success: false, message: 'This issue cannot be marked as resolved.' });
        }

        issue.status = 'resolved';
        issue.resolvedBy = resolvedBy;
        issue.resolvedAt = Date.now();
        await issue.save({ session });

        // TODO: (Optional) อัปเดตสถานะของ Hole Model เป็น 'open'
        // await Hole.findOneAndUpdate({ holeNumber: issue.holeNumber }, { status: 'open' }, { session });

        await session.commitTransaction();
        res.status(200).json({ success: true, data: issue });

    } catch (error) {
        await session.abortTransaction();
        console.error(error);
        res.status(500).json({ success: false, message: 'Error marking issue as resolved.', error: error.message });
    } finally {
        session.endSession();
    }
};

// @desc    แจ้งเปิดหลุม (ใช้ได้ทั้ง Caddy และ Starter) - อาจจะเพื่อยืนยัน หรือบันทึกการเปิดโดยตรง
// @route   PUT /api/issues/report-hole-open
// @access  Private (Caddy, Starter, Admin)
export const reportHoleOpen = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { holeNumber } = req.body;
        const reportedBy = req.user.id;

        if (!holeNumber) {
            return res.status(400).json({ success: false, message: 'Please provide the hole number.' });
        }
        if (holeNumber < 1 || holeNumber > 18) {
            return res.status(400).json({ success: false, message: 'Hole number must be between 1 and 18.' });
        }

        // ค้นหา Issue ที่ยัง active อยู่สำหรับหลุมนี้และเป็นประเภทปิดหลุม
        const activeIssue = await Issue.findOne({
            holeNumber,
            issueType: 'hole_closure_report',
            status: { $in: ['reported', 'in_progress'] } // ยังไม่ resolved หรือ closed
        }).session(session);

        if (activeIssue) {
            // ถ้ามีปัญหาปิดหลุมที่ยังไม่ถูกแก้ ให้ถือว่าเป็นการแก้ไขและเปิดหลุม
            activeIssue.status = 'resolved';
            activeIssue.resolvedBy = reportedBy;
            activeIssue.resolvedAt = Date.now();
            activeIssue.description = activeIssue.description ? activeIssue.description + ' (Opened by ' + req.user.name + ')' : 'Opened'; // เพิ่มบันทึกการเปิด
            await activeIssue.save({ session });
        } else {
            // ถ้าไม่มีปัญหาปิดหลุมที่ active อยู่ ก็สร้าง Issue ใหม่เพื่อบันทึกการเปิด
            // อาจจะใช้ในกรณีที่ต้องการบันทึกว่าหลุมนี้ถูกยืนยันว่าเปิดแล้ว โดยไม่ผ่านกระบวนการปิดก่อนหน้า
            await Issue.create([{
                holeNumber,
                issueType: 'hole_open_report',
                description: `Hole ${holeNumber} confirmed open.`,
                status: 'resolved', // ถือว่า resolved ทันที
                reportedBy,
                resolvedBy: reportedBy,
                resolvedAt: Date.now()
            }], { session });
        }

        // TODO: (Optional) อัปเดตสถานะของ Hole Model เป็น 'open'
        // await Hole.findOneAndUpdate({ holeNumber }, { status: 'open' }, { session });

        await session.commitTransaction();
        res.status(200).json({ success: true, message: `Hole ${holeNumber} has been marked as open.` });

    } catch (error) {
        await session.abortTransaction();
        console.error(error);
        res.status(500).json({ success: false, message: 'Error reporting hole open.', error: error.message });
    } finally {
        session.endSession();
    }
};


// @desc    ดูข้อมูลสถานะหลุมทั้งหมด
// @route   GET /api/issues/hole-status
// @access  Private (Caddy, Starter, Admin, Staff)
export const getHoleStatuses = async (req, res, next) => {
    try {
        const holeStatuses = [];
        for (let i = 1; i <= 18; i++) {
            // ค้นหา Issue ล่าสุดสำหรับหลุมนั้นๆ ที่ยังไม่ถูกแก้ไข (reported, in_progress)
            const activeIssue = await Issue.findOne({
                holeNumber: i,
                status: { $in: ['reported', 'in_progress'] }
            })
            .sort({ reportedAt: -1 }) // เอาอันล่าสุด
            .populate('reportedBy', 'name') // ดึงชื่อคนแจ้ง
            .populate('resolvedBy', 'name'); // ดึงชื่อคนแก้ไข/รับผิดชอบ (ถ้ามี)

            // ค้นหา Issue ล่าสุดที่เพิ่งถูกแก้ไข (resolved) สำหรับหลุมนั้นๆ
            const lastResolvedIssue = await Issue.findOne({
                holeNumber: i,
                status: 'resolved'
            })
            .sort({ resolvedAt: -1 }) // เอาอันที่ resolved ล่าสุด
            .populate('reportedBy', 'name')
            .populate('resolvedBy', 'name');


            let currentStatus = 'open'; // Default
            let activeIssueData = null;

            if (activeIssue) {
                activeIssueData = {
                    issueId: activeIssue._id,
                    issueType: activeIssue.issueType,
                    description: activeIssue.description,
                    reportedBy: activeIssue.reportedBy,
                    reportedAt: activeIssue.reportedAt,
                    status: activeIssue.status,
                    personInCharge: activeIssue.personInCharge
                };

                // กำหนดสถานะของหลุมตาม Issue ที่ active
                if (activeIssue.issueType === 'hole_closure_report' && activeIssue.status === 'reported') {
                    currentStatus = 'closed';
                } else if (activeIssue.issueType === 'hole_closure_report' && activeIssue.status === 'in_progress') {
                    currentStatus = 'under_maintenance';
                }
                // ถ้ามี issueType อื่นๆ ที่ active ก็สามารถเพิ่มเงื่อนไขได้
            }

            holeStatuses.push({
                holeNumber: i,
                currentStatus: currentStatus,
                activeIssue: activeIssueData,
                lastResolvedIssue: lastResolvedIssue ? {
                    issueType: lastResolvedIssue.issueType,
                    description: lastResolvedIssue.description,
                    reportedBy: lastResolvedIssue.reportedBy,
                    reportedAt: lastResolvedIssue.reportedAt,
                    status: lastResolvedIssue.status,
                    resolvedBy: lastResolvedIssue.resolvedBy,
                    resolvedAt: lastResolvedIssue.resolvedAt,
                    personInCharge: lastResolvedIssue.personInCharge
                } : null
            });
        }

        res.status(200).json({ success: true, message: 'Current status of all golf holes retrieved successfully.', holeStatuses });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error retrieving hole statuses.', error: error.message });
    }
};