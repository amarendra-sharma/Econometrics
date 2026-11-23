/* MacroNations AI instructor (Asha) for Econometrics. Loaded from its own file so replacing index.html cannot remove it.
   Asha is on for the test course and for every paid self-study section; real professor sections are added to `courses`
   when the instructor decides. A signed-in self-study student's own section, and (for the administrator) every
   self-study section, are added to the list after sign-in; the widget re-reads the list, and the server still checks
   each course's own Asha settings (eq_ai_settings).
   The widget code is shared with Microeconomics and loaded from there (text chat, whiteboard, graded-work review).
   The widget expects window.sb (Supabase client) and window.State ({user, role, currentCourseId, teachCourseId});
   this portal keeps those in SB / SESSION / PROFILE / COURSE / MY_COURSES, so they are mapped here with getters. */
(function () {
  try {
    if (window.__aiInstructorHook) return; window.__aiInstructorHook = true;
    var base = 'https://microeconomics.macronations.com/ai-instructor/';
    var fn = 'https://rtaiivegcqqmdchpguzn.supabase.co/functions/v1/eq-ai-instructor';
    var courses = ['47e997eb-eee3-4951-841a-170ead9bbe70'];   // Midterm (test course)
    if (typeof window.sb === 'undefined') Object.defineProperty(window, 'sb', { configurable: true, get: function () { return window.SB || null; } });
    if (typeof window.State === 'undefined') Object.defineProperty(window, 'State', { configurable: true, get: function () {
      var ses = window.SESSION, prof = window.PROFILE;
      if (!ses || !ses.user) return null;
      var my = window.MY_COURSES || [];
      return { user: { id: ses.user.id }, role: (prof && prof.role) || 'student', isTA: false,
        currentCourseId: window.COURSE && window.COURSE.id ? window.COURSE.id : null, payCourseId: null, teachCourseId: my.length ? my[0].id : null };
    } });
    window.AI_INSTRUCTOR_CONFIG = { supabaseUrl: 'https://rtaiivegcqqmdchpguzn.supabase.co', functionUrl: fn };
    window.AI_INSTRUCTOR_WIDGET = { courseIds: courses, functionUrl: fn, enrollTable: 'eq_enrollments', courseTable: 'eq_courses' };

    // Add self-study sections to the list (the same array object the widget reads).
    var add = function (id) { if (id && courses.indexOf(id) < 0) courses.push(id); };
    var lastUser = null;
    window.eqAshaRefresh = function () {
      try {
        var SB = window.SB, ses = window.SESSION;
        if (!SB || !ses || !ses.user || ses.user.is_anonymous) return;
        lastUser = ses.user.id;
        SB.rpc('eq_selfstudy_status').then(function (r) {
          var st = r && r.data; if (st && st.course_id && st.enrollment) add(st.course_id);
        }, function () {});
        SB.from('eq_selfstudy_plan').select('course_id').then(function (r) {   // RLS: a student sees their own row, the administrator every row
          ((r && r.data) || []).forEach(function (x) { if (x.course_id && window.PROFILE && window.PROFILE.role === 'admin') add(x.course_id); });
        }, function () {});
      } catch (e) {}
    };
    var tries = 0, timer = setInterval(function () {
      tries++;
      var ses = window.SESSION;
      if (ses && ses.user && !ses.user.is_anonymous && ses.user.id !== lastUser) window.eqAshaRefresh();
      if (tries > 600) clearInterval(timer);   // about 20 minutes; the console also calls eqAshaRefresh after payment or scheduling
    }, 2000);

    ['widget.js', 'teach-panel.js'].forEach(function (f) {
      var s = document.createElement('script'); s.type = 'module'; s.src = base + f + '?v=20261101b'; document.head.appendChild(s);
    });
  } catch (e) {}
})();
