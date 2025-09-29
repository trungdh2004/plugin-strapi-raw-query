import "./index.css";
import { dracula } from "@uiw/codemirror-theme-dracula";
import React, { memo, useEffect, useState } from "react";
import { ContentLayout, HeaderLayout } from "@strapi/design-system/Layout";
import { request, useNotification } from "@strapi/helper-plugin";
import {
  Badge,
  Box,
  Button,
  Flex,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Typography,
} from "@strapi/design-system";
import CodeMirror from "@uiw/react-codemirror";
import { langs } from "@uiw/codemirror-extensions-langs";
import getTrad from "../../utils/getTrad";
import pluginId from "../../pluginId";
import * as pkg from "../../../../package.json";

function HomePage() {
  const toggleNotification = useNotification();

  const [code, setCode] = useState("SELECT * FROM admin_users LIMIT 1;");
  const [tableData, setTableData] = useState(null);
  const [error, setError] = useState(null);
  const [executing, setExecuting] = useState(false);

  const onChange = (value) => {
    window.localStorage.setItem(`${pluginId}_code`, value);
    setCode(value);
  };

  useEffect(() => {
    const tmpCode = window.localStorage.getItem(`${pluginId}_code`);
    if (tmpCode && tmpCode.length) setCode(tmpCode);
  }, []);

  const executeQuery = async () => {
    setExecuting(true);
    setTableData(null);
    setError(null);

    try {
      const response = await request(`/${pluginId}/execute`, {
        method: "POST",
        body: { code: code.replace(/(\r\n|\n|\r)/g, " ") },
      });

      if (response.ok === false) {
        setError(response.response.error || "Unknown error");
      } else {
        setTableData(response.response.result);
        toggleNotification({
          type: "success",
          message: { id: getTrad("notification.info.execute.success") },
        });
      }
    } catch (err) {
      console.log("Error executing query:", err);
      setError(err.message);
      toggleNotification({
        type: "warning",
        message: { id: getTrad("notification.info.execute.error") },
      });
    } finally {
      setExecuting(false);
    }
  };

  const getTableHeaders = (data) => Object.keys(data || {});
  const getTableRows = (data) => data.map((row) => Object.values(row));

  const handleDownloadCSV = () => {
    if (!Array.isArray(tableData) || !tableData.length) return;

    const headersCsv = getTableHeaders(tableData[0]);
    const rowsCsv = getTableRows(tableData);

    const today = new Date();
    const formattedDate = today.toISOString().replace(/[:.]/g, "-");
    const fileName = `export_query_${formattedDate}.csv`;

    const csvHeader = headersCsv.join(",");
    const csvRows = rowsCsv.map((r) => r.join(",")).join("\n");
    const csvContent = `${csvHeader}\n${csvRows}`;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();

    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="raw-query">
      <HeaderLayout
        id="title"
        title={pkg.strapi.displayName}
        subtitle={pkg.strapi.description}
      />
      <ContentLayout>
        <CodeMirror
          extensions={[langs.sql()]}
          theme={dracula}
          height="200px"
          value={code}
          onChange={onChange}
        />

        <Flex gap={2} marginTop={4}>
          <Button
            onClick={executeQuery}
            loading={executing}
            disabled={executing}
          >
            {executing ? "Executing..." : "Execute"}
          </Button>
          {Array.isArray(tableData) && (
            <Button variant="secondary" onClick={handleDownloadCSV}>
              Export CSV
            </Button>
          )}
        </Flex>

        <Box marginTop={6}>
          {error && (
            <Typography textColor="danger600" fontWeight="bold">
              ⚠ SQL Error: {error}
            </Typography>
          )}

          {Array.isArray(tableData) && tableData.length > 0 && (
            <>
              <Flex marginBottom={4}>
                <Badge>
                  {tableData.length} Row{tableData.length > 1 ? "s" : ""}
                </Badge>
              </Flex>
              <Table>
                <Thead>
                  <Tr>
                    {getTableHeaders(tableData[0]).map((th, index) => (
                      <Th key={`th_${index}`} style={{ fontWeight: "bold" }}>
                        {th}
                      </Th>
                    ))}
                  </Tr>
                </Thead>
                <Tbody>
                  {getTableRows(tableData).map((tr, rowIndex) => (
                    <Tr key={`tr_${rowIndex}`}>
                      {tr.map((td, colIndex) => (
                        <Td key={`td_${rowIndex}_${colIndex}`}>{String(td)}</Td>
                      ))}
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </>
          )}
        </Box>
      </ContentLayout>
    </div>
  );
}

export default memo(HomePage);
