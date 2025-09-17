import { NextResponse } from 'next/server';

export async function GET() {
  const universities = [
    {
      id: 'bgu',
      name: 'אוניברסיטת בן-גוריון בנגב',
      domain: 'post.bgu.ac.il',
      moodleUrl: 'https://moodle.bgu.ac.il',
      apiEndpoint: 'https://moodle.bgu.ac.il/login/index.php',
      logo: '/universities/bgu-logo.png',
      activeUsers: 0,
      supportedFeatures: {
        coursesScraping: true,
        assignmentTracking: true,
        gradeMonitoring: true,
        realTimeSync: true,
        fileDownloads: true,
        announcementsSync: true,
      },
      status: 'active',
    },
    {
      id: 'technion',
      name: 'הטכניון',
      domain: 'technion.ac.il',
      moodleUrl: 'https://moodle.technion.ac.il',
      apiEndpoint: 'https://moodle.technion.ac.il/login/index.php',
      logo: '/universities/technion-logo.png',
      activeUsers: 0,
      supportedFeatures: {
        coursesScraping: false,
        assignmentTracking: false,
        gradeMonitoring: false,
        realTimeSync: false,
        fileDownloads: false,
        announcementsSync: false,
      },
      status: 'coming_soon',
    },
    {
      id: 'hebrew',
      name: 'האוניברסיטה העברית',
      domain: 'mail.huji.ac.il',
      moodleUrl: 'https://moodle.huji.ac.il',
      apiEndpoint: 'https://moodle.huji.ac.il/login/index.php',
      logo: '/universities/huji-logo.png',
      activeUsers: 0,
      supportedFeatures: {
        coursesScraping: false,
        assignmentTracking: false,
        gradeMonitoring: false,
        realTimeSync: false,
        fileDownloads: false,
        announcementsSync: false,
      },
      status: 'coming_soon',
    },
    {
      id: 'tau',
      name: 'אוניברסיטת תל אביב',
      domain: 'post.tau.ac.il',
      moodleUrl: 'https://moodle.tau.ac.il',
      apiEndpoint: 'https://moodle.tau.ac.il/login/index.php',
      logo: '/universities/tau-logo.png',
      activeUsers: 0,
      supportedFeatures: {
        coursesScraping: false,
        assignmentTracking: false,
        gradeMonitoring: false,
        realTimeSync: false,
        fileDownloads: false,
        announcementsSync: false,
      },
      status: 'coming_soon',
    },
  ];

  return NextResponse.json({
    universities: universities,
    total: universities.length,
    supported: universities.filter((u) => u.status === 'active').length,
    totalActiveUsers: 0,
  });
}
