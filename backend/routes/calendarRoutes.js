const express = require('express');
const axios = require('axios');

const {
  Project,
  Invoice,
  Employee,
  Holiday,
} = require('../models/ERPModels');

const router = express.Router();



const INDIA_TIMEZONE = 'Asia/Kolkata';

// Google India holiday calendar.
// You can override this from .env using GOOGLE_CALENDAR_ID.
const GOOGLE_CALENDAR_ID =
  process.env.GOOGLE_CALENDAR_ID ||
  'en.indian#holiday@group.v.calendar.google.com';

const GOOGLE_CALENDAR_API_KEY =
  process.env.GOOGLE_CALENDAR_API_KEY || '';

const NAGER_BASE_URL =
  'https://date.nager.at/api/v3/PublicHolidays';


const formatDateOnly = (date) => {
  if (!date) return null;

  const d = new Date(date);

  if (Number.isNaN(d.getTime())) {
    return null;
  }

  return d.toISOString().split('T')[0];
};


const formatCalendarEndDate = (date) => {
  if (!date) return undefined;

  const d = new Date(date);

  if (Number.isNaN(d.getTime())) {
    return undefined;
  }

  d.setUTCDate(d.getUTCDate() + 1);

  return d.toISOString().split('T')[0];
};


const dateStringToUTCDate = (dateString) => {
  if (!dateString) return null;

  const date = new Date(
    `${dateString}T00:00:00.000Z`
  );

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
};


const getYearStart = (year) => {
  return new Date(
    `${year}-01-01T00:00:00.000Z`
  );
};


const getNextYearStart = (year) => {
  return new Date(
    `${year + 1}-01-01T00:00:00.000Z`
  );
};


const normalizeText = (value) => {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\p{L}\p{N}\s-]/gu, '');
};


const makeSafeSourceId = (value) => {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 500);
};


/*
|--------------------------------------------------------------------------
| ACTIVE HOLIDAY QUERY
|--------------------------------------------------------------------------
|
| Old Holiday documents may not have isActive.
| Therefore both conditions are supported.
|--------------------------------------------------------------------------
*/

const activeHolidayQuery = {
  $or: [
    { isActive: true },
    { isActive: { $exists: false } },
  ],
};


/*
|--------------------------------------------------------------------------
| INVOICE HELPERS
|--------------------------------------------------------------------------
*/

const getInvoiceClientName = (invoice) => {
  if (invoice.customClientName) {
    return invoice.customClientName;
  }

  if (invoice.client) {
    if (typeof invoice.client === 'object') {
      return (
        invoice.client.name ||
        invoice.client.companyName ||
        invoice.client.clientName ||
        'Client'
      );
    }

    return String(invoice.client);
  }

  if (
    invoice.billTo &&
    invoice.billTo.companyName
  ) {
    return invoice.billTo.companyName;
  }

  return 'Client';
};


const formatAmount = (
  amount,
  currency = 'INR'
) => {
  const numericAmount = Number(amount || 0);

  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(numericAmount);
  } catch (error) {
    return `${currency} ${numericAmount.toFixed(2)}`;
  }
};


const getInvoiceColor = (status) => {
  if (status === 'Paid') {
    return '#6c757d';
  }

  if (status === 'Cancelled') {
    return '#6c757d';
  }

  if (status === 'Overdue') {
    return '#dc3545';
  }

  return '#dc3545';
};


const getLeaveColor = (status) => {
  if (status === 'Approved') {
    return '#198754';
  }

  if (status === 'Pending') {
    return '#ffc107';
  }

  return '#dc3545';
};

const fetchGoogleCalendarEvents = async (year) => {
  try {
    const calendarId = 'en.indian#holiday@group.v.calendar.google.com';

    const icsUrl =
      `https://calendar.google.com/calendar/ical/` +
      `${encodeURIComponent(calendarId)}/public/basic.ics`;

    const response = await axios.get(icsUrl, {
      timeout: 20000,
      responseType: 'text',
      headers: {
        Accept: 'text/calendar',
      },
    });

    const ics = response.data;

    if (!ics || typeof ics !== 'string') {
      console.warn('[Calendar] Google ICS returned empty response');
      return [];
    }

    const events = [];

    // Handle folded ICS lines
    const unfolded = ics.replace(/\r?\n[ \t]/g, '');

    const blocks = unfolded.split('BEGIN:VEVENT');

    for (const block of blocks) {
      if (!block.includes('END:VEVENT')) {
        continue;
      }

      const getField = (field) => {
        const regex = new RegExp(
          `(?:^|\\n)${field}(?:;[^:]*)?:([^\\n\\r]*)`,
          'i'
        );

        const match = block.match(regex);

        return match ? match[1].trim() : '';
      };

      const summary = getField('SUMMARY');

      const description = getField('DESCRIPTION');

      let startDate = getField('DTSTART');

      let endDate = getField('DTEND');

      if (!summary || !startDate) {
        continue;
      }

      // Remove timezone/date formatting
      startDate = startDate
        .replace(/T.*$/, '')
        .replace(/Z$/, '');

      endDate = endDate
        ? endDate
            .replace(/T.*$/, '')
            .replace(/Z$/, '')
        : '';

      // Google ICS normally returns YYYYMMDD
      if (!/^\d{8}$/.test(startDate)) {
        continue;
      }

      const formattedStart =
        `${startDate.substring(0, 4)}-` +
        `${startDate.substring(4, 6)}-` +
        `${startDate.substring(6, 8)}`;

      let formattedEnd = '';

      if (/^\d{8}$/.test(endDate)) {
        formattedEnd =
          `${endDate.substring(0, 4)}-` +
          `${endDate.substring(4, 6)}-` +
          `${endDate.substring(6, 8)}`;
      }

      // Only requested year
      if (
        !formattedStart.startsWith(String(year))
      ) {
        continue;
      }

      events.push({
        id: getField('UID') || '',
        summary,
        description,
        start: formattedStart,
        end: formattedEnd,
      });
    }

    console.log(
      `[Calendar] Google ICS fetched ${events.length} holidays for ${year}`
    );

    return events;
  } catch (error) {
    console.error(
      '[Calendar] Google ICS sync failed:',
      error.response?.data || error.message
    );

    return [];
  }
};


const fetchNagerHolidays = async (year) => {
  const response = await axios.get(
    `${NAGER_BASE_URL}/${year}/IN`,
    {
      timeout: 15000,
    }
  );

  return Array.isArray(response.data)
    ? response.data
    : [];
};



const syncGoogleEvent = async (
  googleEvent,
  year
) => {
  if (!googleEvent) {
    return null;
  }

  const title =
    String(
      googleEvent.summary ||
        googleEvent.description ||
        'Holiday'
    ).trim();

  const dateString =
    googleEvent.start || null;

  const endDateString =
    googleEvent.end || null;

  if (!dateString) {
    return null;
  }

  if (
    !dateString.startsWith(
      String(year)
    )
  ) {
    return null;
  }

  const startDate =
    dateStringToUTCDate(
      dateString
    );

  if (!startDate) {
    return null;
  }


  let endDate = null;

  if (endDateString) {
    const parsedEnd =
      dateStringToUTCDate(
        endDateString
      );

    if (parsedEnd) {
      parsedEnd.setUTCDate(
        parsedEnd.getUTCDate() - 1
      );

      endDate = parsedEnd;
    }
  }


  const sourceId =
    `google-${makeSafeSourceId(
      googleEvent.id ||
        `${title}-${dateString}`
    )}`;



  const existing =
    await Holiday.findOne({
      source: 'API',
      sourceId,
    }).lean();

  const updateData = {
    title,

    localName:
      title,

    date:
      startDate,

    endDate,

    type:
      'Public',

    description:
      googleEvent.description ||
      'Automatically imported from Google India Holiday Calendar.',

    countryCode:
      'IN',

    isActive:
      true,

    source:
      'API',

    sourceId,

    updatedAt:
      new Date(),
  };

  /*
   * New holiday = Holiday
   *
   * Existing holiday:
   * DO NOT overwrite status.
   */

  if (!existing) {
    updateData.status =
      'Holiday';
  }

  const saved =
    await Holiday.findOneAndUpdate(
      {
        source: 'API',
        sourceId,
      },
      {
        $set: updateData,
      },
   {
  upsert: true,
  returnDocument: 'after',
  setDefaultsOnInsert: true,
}
    );

  return saved;
};


const syncNagerHoliday = async (
  holiday,
  year
) => {
  if (
    !holiday ||
    !holiday.date ||
    !holiday.name
  ) {
    return null;
  }

  const date =
    dateStringToUTCDate(
      holiday.date
    );

  if (!date) {
    return null;
  }

  const sourceId =
    `nager-${makeSafeSourceId(
      `${holiday.date}-${holiday.name}`
    )}`;

  const existing =
    await Holiday.findOne({
      source: 'API',
      sourceId,
    }).lean();

  const isPublic =
    Array.isArray(holiday.types) &&
    holiday.types.includes('Public');

  const updateData = {
    title:
      String(holiday.name).trim(),

    localName:
      holiday.localName || '',

    date,

    endDate: undefined,

    type:
      isPublic
        ? 'Public'
        : 'Optional',

    description:
      holiday.counties?.length
        ? `Regional holiday: ${holiday.counties.join(
            ', '
          )}`
        : 'Imported from Nager holiday API.',

    countryCode:
      holiday.countryCode || 'IN',

    isActive: true,

    source: 'API',

    sourceId,
  };

  /*
  |--------------------------------------------------------------------------
  | Do not overwrite admin status
  |--------------------------------------------------------------------------
  */

  if (!existing) {
    updateData.status = 'Holiday';
  }

  const saved =
    await Holiday.findOneAndUpdate(
      {
        source: 'API',
        sourceId,
      },

      {
        $set: updateData,
      },

      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

  return saved;
};


/*
|--------------------------------------------------------------------------
| REMOVE DUPLICATE API RECORDS
|--------------------------------------------------------------------------
|
| If both Google and Nager contain the same festival,
| we keep one event and remove the duplicate API record.
|
| Manual Company holidays are NEVER deleted.
|--------------------------------------------------------------------------
*/

const removeDuplicateApiHolidays =
  async (year) => {
    const start =
      getYearStart(year);

    const end =
      getNextYearStart(year);

    const apiHolidays =
      await Holiday.find({
        source: 'API',

        date: {
          $gte: start,
          $lt: end,
        },

        ...activeHolidayQuery,
      })
        .sort({
          date: 1,
          createdAt: 1,
        })
        .lean();

    const seen = new Map();

    const duplicateIds = [];

    for (const holiday of apiHolidays) {
      const key =
        `${formatDateOnly(
          holiday.date
        )}|${normalizeText(
          holiday.title
        )}`;

      if (seen.has(key)) {
        duplicateIds.push(
          holiday._id
        );
      } else {
        seen.set(key, holiday._id);
      }
    }

    if (duplicateIds.length) {
      await Holiday.deleteMany({
        _id: {
          $in: duplicateIds,
        },
        source: 'API',
      });
    }

    return duplicateIds.length;
  };


/*
|--------------------------------------------------------------------------
| FULL YEARLY SYNC
|--------------------------------------------------------------------------
*/

const syncYearHolidays = async (
  year
) => {
  if (
    !Number.isInteger(year) ||
    year < 2000 ||
    year > 2100
  ) {
    throw new Error(
      'Invalid holiday sync year.'
    );
  }

  const result = {
    year,

    googleFetched: 0,

    nagerFetched: 0,

    googleSynced: 0,

    nagerSynced: 0,

    duplicatesRemoved: 0,

    googleSkipped: false,

    errors: [],
  };


  /*
  |--------------------------------------------------------------------------
  | GOOGLE
  |--------------------------------------------------------------------------
  */

  try {
    const googleEvents =
      await fetchGoogleCalendarEvents(
        year
      );

    result.googleFetched =
      googleEvents.length;

    for (const event of googleEvents) {
      try {
        const saved =
          await syncGoogleEvent(
            event,
            year
          );

        if (saved) {
          result.googleSynced++;
        }
      } catch (error) {
        console.error(
          '[Calendar] Google event sync error:',
          error.message
        );

        result.errors.push({
          source: 'Google',
          event:
            event.summary || 'Unknown',
          error: error.message,
        });
      }
    }
  } catch (error) {
    result.googleSkipped = true;

    console.error(
      '[Calendar] Google sync failed:',
      error.response?.data ||
        error.message
    );

    result.errors.push({
      source: 'Google',
      error:
        error.response?.data ||
        error.message,
    });
  }


  /*
  |--------------------------------------------------------------------------
  | NAGER
  |--------------------------------------------------------------------------
  */

  try {
    const nagerHolidays =
      await fetchNagerHolidays(
        year
      );

    result.nagerFetched =
      nagerHolidays.length;

    for (const holiday of nagerHolidays) {
      try {
        const saved =
          await syncNagerHoliday(
            holiday,
            year
          );

        if (saved) {
          result.nagerSynced++;
        }
      } catch (error) {
        console.error(
          '[Calendar] Nager event sync error:',
          error.message
        );

        result.errors.push({
          source: 'Nager',
          event:
            holiday.name || 'Unknown',
          error: error.message,
        });
      }
    }
  } catch (error) {
    console.error(
      '[Calendar] Nager sync failed:',
      error.response?.data ||
        error.message
    );

    result.errors.push({
      source: 'Nager',
      error:
        error.response?.data ||
        error.message,
    });
  }


  /*
  |--------------------------------------------------------------------------
  | REMOVE DUPLICATES
  |--------------------------------------------------------------------------
  */

  result.duplicatesRemoved =
    await removeDuplicateApiHolidays(
      year
    );

  return result;
};


/*
|--------------------------------------------------------------------------
| AUTOMATIC YEARLY SYNC
|--------------------------------------------------------------------------
|
| Server starts:
|
| Current year
| Next year
|
| Then every January 1 at 12:05 AM IST,
| current + next year are synced again.
|--------------------------------------------------------------------------
*/

let yearlySyncTimer = null;


const scheduleNextYearlySync = () => {
  if (yearlySyncTimer) {
    clearTimeout(
      yearlySyncTimer
    );
  }

  const now = new Date();

  const nowISTString =
    new Intl.DateTimeFormat(
      'en-CA',
      {
        timeZone:
          INDIA_TIMEZONE,

        year: 'numeric',
        month: '2-digit',
        day: '2-digit',

        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',

        hour12: false,
      }
    ).format(now);

  console.log(
    `[Calendar] Current IST time: ${nowISTString}`
  );

  /*
  |--------------------------------------------------------------------------
  | Instead of complicated timezone calculations,
  | check once every hour.
  |--------------------------------------------------------------------------
  */

  yearlySyncTimer =
    setTimeout(
      async () => {
        try {
          const currentYear =
            Number(
              new Intl.DateTimeFormat(
                'en-US',
                {
                  timeZone:
                    INDIA_TIMEZONE,

                  year: 'numeric',
                }
              ).format(
                new Date()
              )
            );

          const currentMonth =
            Number(
              new Intl.DateTimeFormat(
                'en-US',
                {
                  timeZone:
                    INDIA_TIMEZONE,

                  month: 'numeric',
                }
              ).format(
                new Date()
              )
            );

          const currentDay =
            Number(
              new Intl.DateTimeFormat(
                'en-US',
                {
                  timeZone:
                    INDIA_TIMEZONE,

                  day: 'numeric',
                }
              ).format(
                new Date()
              )
            );

          /*
          |--------------------------------------------------------------------------
          | January 1
          |--------------------------------------------------------------------------
          */

          if (
            currentMonth === 1 &&
            currentDay === 1
          ) {
            console.log(
              `[Calendar] Automatic yearly festival sync started for ${currentYear}.`
            );

            await syncYearHolidays(
              currentYear
            );

            await syncYearHolidays(
              currentYear + 1
            );

            console.log(
              `[Calendar] Automatic yearly festival sync completed.`
            );
          }
        } catch (error) {
          console.error(
            '[Calendar] Automatic yearly sync error:',
            error.message
          );
        }

        /*
        |--------------------------------------------------------------------------
        | Check again after 1 hour
        |--------------------------------------------------------------------------
        */

        scheduleNextYearlySync();

      },

      60 * 60 * 1000
    );
};


/*
|--------------------------------------------------------------------------
| INITIAL AUTOMATIC SYNC
|--------------------------------------------------------------------------
|
| Runs when backend starts.
|
| Current year + next year.
|--------------------------------------------------------------------------
*/

const runInitialHolidaySync =
  async () => {
    try {
      const currentYear =
        Number(
          new Intl.DateTimeFormat(
            'en-US',
            {
              timeZone:
                INDIA_TIMEZONE,

              year: 'numeric',
            }
          ).format(
            new Date()
          )
        );

      console.log(
        `[Calendar] Initial holiday sync started for ${currentYear}.`
      );

      await syncYearHolidays(
        currentYear
      );

      await syncYearHolidays(
        currentYear + 1
      );

      console.log(
        `[Calendar] Initial holiday sync completed.`
      );

    } catch (error) {
      console.error(
        '[Calendar] Initial holiday sync failed:',
        error.message
      );
    }
  };


/*
|--------------------------------------------------------------------------
| START AUTOMATIC SYNC
|--------------------------------------------------------------------------
*/

runInitialHolidaySync();

scheduleNextYearlySync();


/*
|--------------------------------------------------------------------------
| GET CALENDAR EVENTS
|--------------------------------------------------------------------------
*/

router.get(
  '/calendar-events',
  async (req, res) => {
    try {
      const [
        projects,
        invoices,
        employees,
        holidays,
      ] = await Promise.all([
        /*
        |--------------------------------------------------------------------------
        | Projects
        |--------------------------------------------------------------------------
        */

        Project.find({
          deadline: {
            $exists: true,
            $ne: null,
          },
        })
          .populate('client')
          .lean(),

        /*
        |--------------------------------------------------------------------------
        | Invoices
        |--------------------------------------------------------------------------
        */

        Invoice.find({
          dueDate: {
            $exists: true,
            $ne: null,
          },
        })
          .populate('client')
          .lean(),

        /*
        |--------------------------------------------------------------------------
        | Employees
        |--------------------------------------------------------------------------
        */

        Employee.find({
          leaves: {
            $exists: true,
            $ne: [],
          },
        }).lean(),

        /*
        |--------------------------------------------------------------------------
        | Holidays + Festivals
        |--------------------------------------------------------------------------
        */

        Holiday.find(
          activeHolidayQuery
        )
          .sort({
            date: 1,
          })
          .lean(),
      ]);


      const events = [];


      /*
      |--------------------------------------------------------------------------
      | PROJECT EVENTS
      |--------------------------------------------------------------------------
      */

      projects.forEach(
        (project) => {
          if (!project.deadline) {
            return;
          }

          events.push({
            id:
              `project-${project._id}`,

            title:
              `Project: ${project.name}`,

            start:
              formatDateOnly(
                project.deadline
              ),

            allDay: true,

            color: '#FF4D00',

            textColor: '#ffffff',

            extendedProps: {
              type: 'Project',

              description:
                project.description ||
                'No project description available.',

              status:
                project.status ||
                'Planning',

              progress:
                project.progress !==
                  undefined &&
                project.progress !==
                  null
                  ? `${project.progress}%`
                  : '0%',

              client:
                project.customClientName ||
                project.client?.name ||
                project.client?.companyName ||
                'Client',
            },
          });
        }
      );


      /*
      |--------------------------------------------------------------------------
      | INVOICE EVENTS
      |--------------------------------------------------------------------------
      */

      invoices.forEach(
        (invoice) => {
          if (!invoice.dueDate) {
            return;
          }

          const status =
            invoice.status ||
            'Draft';

          events.push({
            id:
              `invoice-${invoice._id}`,

            title:
              `Invoice ${
                invoice.invoiceNumber ||
                ''
              }`,

            start:
              formatDateOnly(
                invoice.dueDate
              ),

            allDay: true,

            color:
              getInvoiceColor(
                status
              ),

            textColor:
              '#ffffff',

            extendedProps: {
              type:
                'Invoice Due',

              invoiceNumber:
                invoice.invoiceNumber ||
                'N/A',

              client:
                getInvoiceClientName(
                  invoice
                ),

              amount:
                formatAmount(
                  invoice.totalAmount,
                  invoice.currency ||
                    'INR'
                ),

              status,

              description:
                invoice.subject ||
                'Invoice payment due date.',
            },
          });
        }
      );


      /*
      |--------------------------------------------------------------------------
      | EMPLOYEE LEAVE EVENTS
      |--------------------------------------------------------------------------
      */

      employees.forEach(
        (employee) => {
          if (
            !Array.isArray(
              employee.leaves
            )
          ) {
            return;
          }

          employee.leaves.forEach(
            (
              leave,
              index
            ) => {
              if (
                leave.status ===
                'Rejected'
              ) {
                return;
              }

              if (
                !leave.startDate
              ) {
                return;
              }

              const employeeName =
                employee.name ||
                employee.fullName ||
                'Employee';

              const designation =
                employee.designation ||
                employee.position ||
                employee.role ||
                'Employee';

              events.push({
                id:
                  `leave-${employee._id}-${index}`,

                title:
                  `${employeeName} - ${
                    leave.type ||
                    'Leave'
                  }`,

                start:
                  formatDateOnly(
                    leave.startDate
                  ),

                end:
                  leave.endDate
                    ? formatCalendarEndDate(
                        leave.endDate
                      )
                    : undefined,

                allDay: true,

                color:
                  getLeaveColor(
                    leave.status ||
                      'Pending'
                  ),

                textColor:
                  leave.status ===
                  'Pending'
                    ? '#212529'
                    : '#ffffff',

                extendedProps: {
                  type:
                    'Employee Leave',

                  employeeName,

                  designation,

                  status:
                    leave.status ||
                    'Pending',

                  reason:
                    leave.reason ||
                    'No reason provided.',

                  leaveType:
                    leave.type ||
                    'Leave',
                },
              });
            }
          );
        }
      );


      /*
      |--------------------------------------------------------------------------
      | HOLIDAY + FESTIVAL EVENTS
      |--------------------------------------------------------------------------
      */

      holidays.forEach(
        (holiday) => {
          if (!holiday.date) {
            return;
          }

          const isWorking =
            holiday.status ===
            'Working';

          const source =
            holiday.source ||
            'Company';

          const eventType =
            source === 'API'
              ? 'Festival / Public Holiday'
              : 'Company Holiday';

          events.push({
            id:
              `holiday-${holiday._id}`,

            title:
              isWorking
                ? `${holiday.title} - Working`
                : holiday.title,

            start:
              formatDateOnly(
                holiday.date
              ),

            end:
              holiday.endDate
                ? formatCalendarEndDate(
                    holiday.endDate
                  )
                : undefined,

            allDay: true,

            color:
              isWorking
                ? '#6c757d'
                : source === 'API'
                ? '#7c3aed'
                : '#6f42c1',

            textColor:
              '#ffffff',

            extendedProps: {
              type:
                eventType,

              description:
                holiday.description ||
                '',

              holidayType:
                holiday.type ||
                'Company',

              status:
                holiday.status ||
                'Holiday',

              source,

              localName:
                holiday.localName ||
                '',

              countryCode:
                holiday.countryCode ||
                'IN',

              isFestival:
                source === 'API',
            },
          });
        }
      );


      /*
      |--------------------------------------------------------------------------
      | SORT EVENTS
      |--------------------------------------------------------------------------
      */

      events.sort(
        (a, b) => {
          return (
            new Date(a.start) -
            new Date(b.start)
          );
        }
      );


      return res.json(events);

    } catch (error) {
      console.error(
        'GET /erp/calendar-events error:',
        error
      );

      return res.status(500).json({
        message:
          'Failed to load calendar events.',

        error:
          process.env.NODE_ENV ===
          'development'
            ? error.message
            : undefined,
      });
    }
  }
);


/*
|--------------------------------------------------------------------------
| GET HOLIDAYS
|--------------------------------------------------------------------------
*/

router.get(
  '/holidays',
  async (req, res) => {
    try {
      const {
        year,
      } = req.query;

      const query = {
        ...activeHolidayQuery,
      };


      if (year) {
        const numericYear =
          Number(year);

        if (
          !Number.isInteger(
            numericYear
          ) ||
          numericYear < 2000 ||
          numericYear > 2100
        ) {
          return res.status(400).json({
            message:
              'Invalid year.',
          });
        }

        query.date = {
          $gte:
            getYearStart(
              numericYear
            ),

          $lt:
            getNextYearStart(
              numericYear
            ),
        };
      }


      const holidays =
        await Holiday.find(
          query
        )
          .sort({
            date: 1,
          })
          .lean();


      return res.json(
        holidays
      );

    } catch (error) {
      console.error(
        'GET /erp/holidays error:',
        error
      );

      return res.status(500).json({
        message:
          'Failed to fetch holidays.',
      });
    }
  }
);


/*
|--------------------------------------------------------------------------
| GET PUBLIC HOLIDAYS FROM NAGER
|--------------------------------------------------------------------------
|
| Kept for compatibility with your existing frontend/backend.
|--------------------------------------------------------------------------
*/

router.get(
  '/holidays/public/:year',
  async (req, res) => {
    try {
      const year =
        Number(req.params.year);

      if (
        !Number.isInteger(year) ||
        year < 2000 ||
        year > 2100
      ) {
        return res.status(400).json({
          message:
            'Invalid year.',
        });
      }

      const response =
        await axios.get(
          `${NAGER_BASE_URL}/${year}/IN`,
          {
            timeout: 15000,
          }
        );

      return res.json(
        response.data || []
      );

    } catch (error) {
      console.error(
        'Nager public holiday API error:',
        error.response?.data ||
          error.message
      );

      return res.status(500).json({
        message:
          'Failed to fetch public holidays from holiday API.',
      });
    }
  }
);


/*
|--------------------------------------------------------------------------
| MANUAL / API SYNC
|--------------------------------------------------------------------------
|
| You can still call:
|
| POST /erp/holidays/sync
|
| body:
| {
|   "year": 2026
| }
|--------------------------------------------------------------------------
*/

router.post(
  '/holidays/sync',
  async (req, res) => {
    try {
      const requestedYear =
        Number(req.body?.year) ||
        new Date().getFullYear();

      if (
        !Number.isInteger(
          requestedYear
        ) ||
        requestedYear < 2000 ||
        requestedYear > 2100
      ) {
        return res.status(400).json({
          message:
            'Invalid year.',
        });
      }

      const result =
        await syncYearHolidays(
          requestedYear
        );

      return res.json({
        message:
          'Holidays and festivals synchronized successfully.',

        ...result,
      });

    } catch (error) {
      console.error(
        'POST /erp/holidays/sync error:',
        error
      );

      return res.status(500).json({
        message:
          'Failed to synchronize holidays.',
      });
    }
  }
);


/*
|--------------------------------------------------------------------------
| CREATE MANUAL HOLIDAY
|--------------------------------------------------------------------------
*/

router.post(
  '/holidays',
  async (req, res) => {
    try {
      const {
        title,
        date,
        endDate,
        type,
        description,
        status,
        localName,
      } = req.body;


      if (
        !title ||
        !String(title).trim()
      ) {
        return res.status(400).json({
          message:
            'Holiday title is required.',
        });
      }


      if (!date) {
        return res.status(400).json({
          message:
            'Holiday date is required.',
        });
      }


      const startDate =
        dateStringToUTCDate(
          date
        );

      if (!startDate) {
        return res.status(400).json({
          message:
            'Invalid holiday date.',
        });
      }


      let parsedEndDate;


      if (endDate) {
        parsedEndDate =
          dateStringToUTCDate(
            endDate
          );

        if (!parsedEndDate) {
          return res.status(400).json({
            message:
              'Invalid holiday end date.',
          });
        }


        if (
          parsedEndDate <
          startDate
        ) {
          return res.status(400).json({
            message:
              'End date cannot be before start date.',
          });
        }
      }


      const holiday =
        await Holiday.create({
          title:
            String(title).trim(),

          date:
            startDate,

          endDate:
            parsedEndDate,

          type:
            [
              'Public',
              'Company',
              'Optional',
            ].includes(type)
              ? type
              : 'Company',

          description:
            description || '',

          source:
            'Company',

          sourceId:
            '',

          localName:
            localName || '',

          status:
            status === 'Working'
              ? 'Working'
              : 'Holiday',

          countryCode:
            'IN',

          isActive:
            true,
        });


      return res.status(201).json({
        message:
          'Holiday created successfully.',

        holiday,
      });

    } catch (error) {
      console.error(
        'POST /erp/holidays error:',
        error
      );

      return res.status(500).json({
        message:
          'Failed to create holiday.',
      });
    }
  }
);


/*
|--------------------------------------------------------------------------
| UPDATE HOLIDAY
|--------------------------------------------------------------------------
*/

router.put(
  '/holidays/:id',
  async (req, res) => {
    try {
      const {
        title,
        date,
        endDate,
        type,
        description,
        status,
        localName,
        isActive,
      } = req.body;


      const updateData = {};


      if (title !== undefined) {
        if (
          !String(title).trim()
        ) {
          return res.status(400).json({
            message:
              'Holiday title cannot be empty.',
          });
        }

        updateData.title =
          String(title).trim();
      }


      if (date !== undefined) {
        const parsedDate =
          dateStringToUTCDate(
            date
          );

        if (!parsedDate) {
          return res.status(400).json({
            message:
              'Invalid holiday date.',
          });
        }

        updateData.date =
          parsedDate;
      }


      if (endDate !== undefined) {
        if (
          endDate === '' ||
          endDate === null
        ) {
          updateData.endDate =
            null;
        } else {
          const parsedEndDate =
            dateStringToUTCDate(
              endDate
            );

          if (!parsedEndDate) {
            return res.status(400).json({
              message:
                'Invalid holiday end date.',
            });
          }

          updateData.endDate =
            parsedEndDate;
        }
      }


      if (type !== undefined) {
        if (
          ![
            'Public',
            'Company',
            'Optional',
          ].includes(type)
        ) {
          return res.status(400).json({
            message:
              'Invalid holiday type.',
          });
        }

        updateData.type =
          type;
      }


      if (status !== undefined) {
        if (
          ![
            'Holiday',
            'Working',
          ].includes(status)
        ) {
          return res.status(400).json({
            message:
              'Invalid holiday status.',
          });
        }

        updateData.status =
          status;
      }


      if (
        description !==
        undefined
      ) {
        updateData.description =
          description;
      }


      if (
        localName !==
        undefined
      ) {
        updateData.localName =
          localName;
      }


      if (
        isActive !==
        undefined
      ) {
        updateData.isActive =
          Boolean(isActive);
      }


      updateData.updatedAt =
        new Date();


      const holiday =
        await Holiday.findByIdAndUpdate(
          req.params.id,

          {
            $set:
              updateData,
          },

          {
            new: true,
            runValidators: true,
          }
        );


      if (!holiday) {
        return res.status(404).json({
          message:
            'Holiday not found.',
        });
      }


      return res.json({
        message:
          'Holiday updated successfully.',

        holiday,
      });

    } catch (error) {
      console.error(
        'PUT /erp/holidays/:id error:',
        error
      );

      return res.status(500).json({
        message:
          'Failed to update holiday.',
      });
    }
  }
);


/*
|--------------------------------------------------------------------------
| UPDATE HOLIDAY STATUS
|--------------------------------------------------------------------------
*/

router.patch(
  '/holidays/:id/status',
  async (req, res) => {
    try {
      const {
        status,
      } = req.body;


      if (
        ![
          'Holiday',
          'Working',
        ].includes(status)
      ) {
        return res.status(400).json({
          message:
            'Status must be either Holiday or Working.',
        });
      }


      const holiday =
        await Holiday.findByIdAndUpdate(
          req.params.id,

          {
            $set: {
              status,

              updatedAt:
                new Date(),
            },
          },

          {
            new: true,
            runValidators: true,
          }
        );


      if (!holiday) {
        return res.status(404).json({
          message:
            'Holiday not found.',
        });
      }


      return res.json({
        message:
          `Holiday status changed to ${status}.`,

        holiday,
      });

    } catch (error) {
      console.error(
        'PATCH /erp/holidays/:id/status error:',
        error
      );

      return res.status(500).json({
        message:
          'Failed to update holiday status.',
      });
    }
  }
);


/*
|--------------------------------------------------------------------------
| DELETE HOLIDAY
|--------------------------------------------------------------------------
*/

router.delete(
  '/holidays/:id',
  async (req, res) => {
    try {
      const holiday =
        await Holiday.findById(
          req.params.id
        );


      if (!holiday) {
        return res.status(404).json({
          message:
            'Holiday not found.',
        });
      }


      await Holiday.findByIdAndDelete(
        req.params.id
      );


      return res.json({
        message:
          'Holiday removed successfully.',
      });

    } catch (error) {
      console.error(
        'DELETE /erp/holidays/:id error:',
        error
      );

      return res.status(500).json({
        message:
          'Failed to remove holiday.',
      });
    }
  }
);


/*
|--------------------------------------------------------------------------
| GET SINGLE HOLIDAY
|--------------------------------------------------------------------------
*/

router.get(
  '/holidays/:id',
  async (req, res) => {
    try {
      const holiday =
        await Holiday.findById(
          req.params.id
        );


      if (!holiday) {
        return res.status(404).json({
          message:
            'Holiday not found.',
        });
      }


      return res.json(
        holiday
      );

    } catch (error) {
      console.error(
        'GET /erp/holidays/:id error:',
        error
      );

      return res.status(500).json({
        message:
          'Failed to fetch holiday.',
      });
    }
  }
);




module.exports = router;