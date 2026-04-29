import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store/auth';
import { generateEnrollmentNumber } from '@/lib/enrollment';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ScreenHeader from '@/components/ui/ScreenHeader';

type ImportType = 'students' | 'fees';

interface ImportResult {
  success: number;
  failed: number;
  skipped: number;
  errors: string[];
  generated: string[];
}

const STUDENT_TEMPLATE = `student_name,phone,email,parent_name,parent_phone,class_level,date_of_birth,gender,address
John Doe,9876543210,john@email.com,Mr. Doe,9876543211,Class 10,2008-05-15,male,123 Main St
Jane Smith,9876543212,,Mrs. Smith,9876543213,Class 9,2009-03-20,female,456 Park Ave`;

const FEE_TEMPLATE = `enrollment_number,amount,payment_method,month_year,status,notes
SF-2026-001,2000,cash,April 2026,paid,
SF-2026-002,2000,upi,April 2026,pending,Late payment`;

export default function BulkImportScreen() {
  const { institute } = useAuthStore();
  const [importType, setImportType] = useState<ImportType>('students');
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const pickFile = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', 'application/csv'],
        copyToCacheDirectory: true,
      });
      if (res.canceled) return;
      const asset = res.assets[0];
      setFileName(asset.name);
      setResult(null);

      // Read file content
      const response = await fetch(asset.uri);
      const text = await response.text();
      setFileContent(text);
    } catch (err) {
      Alert.alert('Error', 'Could not read file');
    }
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    return lines.slice(1).map(line => {
      const vals = line.split(',').map(v => v.trim().replace(/"/g, ''));
      const row: any = {};
      headers.forEach((h, i) => { row[h] = vals[i] || ''; });
      return row;
    });
  };

  const handleImport = async () => {
    if (!fileContent) { Alert.alert('Error', 'Please select a file first'); return; }
    setLoading(true);
    const rows = parseCSV(fileContent);
    if (rows.length === 0) { Alert.alert('Error', 'No data found in file'); setLoading(false); return; }

    const res: ImportResult = { success: 0, failed: 0, skipped: 0, errors: [], generated: [] };

    if (importType === 'students') {
      for (const row of rows) {
        if (!row.student_name?.trim() || !row.phone?.trim()) {
          res.failed++;
          res.errors.push(`Row skipped: missing name or phone`);
          continue;
        }
        try {
          // Check duplicate
          const { data: existing } = await supabase
            .from('institute_students').select('id')
            .eq('institute_id', institute!.id)
            .eq('phone', row.phone.trim())
            .eq('class_level', row.class_level || '');
          if (existing && existing.length > 0) {
            res.skipped++;
            continue;
          }
          const enr = await generateEnrollmentNumber(institute!.id, institute!.name);
          const { error } = await supabase.from('institute_students').insert({
            institute_id: institute!.id,
            student_name: row.student_name.trim(),
            phone: row.phone.trim(),
            email: row.email || null,
            parent_name: row.parent_name || null,
            parent_phone: row.parent_phone || null,
            class_level: row.class_level || null,
            date_of_birth: row.date_of_birth || null,
            gender: row.gender || 'other',
            address: row.address || null,
            enrollment_number: enr,
            enrollment_date: new Date().toISOString().split('T')[0],
            status: 'active',
          });
          if (error) throw error;
          res.success++;
          res.generated.push(enr);
        } catch (err: any) {
          res.failed++;
          res.errors.push(`${row.student_name}: ${err.message}`);
        }
      }
    } else {
      // Fee import
      for (const row of rows) {
        if (!row.enrollment_number?.trim() || !row.amount) {
          res.failed++;
          res.errors.push('Row skipped: missing enrollment number or amount');
          continue;
        }
        try {
          const { data: student } = await supabase
            .from('institute_students').select('id')
            .eq('institute_id', institute!.id)
            .eq('enrollment_number', row.enrollment_number.trim())
            .single();
          if (!student) { res.failed++; res.errors.push(`Student not found: ${row.enrollment_number}`); continue; }

          const { error } = await supabase.from('fee_payments').insert({
            institute_id: institute!.id,
            student_id: student.id,
            amount: parseFloat(row.amount),
            payment_date: new Date().toISOString().split('T')[0],
            payment_method: row.payment_method || 'cash',
            month_year: row.month_year || null,
            status: row.status || 'paid',
            notes: row.notes || null,
            receipt_number: `RCP-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            created_by: institute!.admin_user_id,
          });
          if (error) throw error;
          res.success++;
        } catch (err: any) {
          res.failed++;
          res.errors.push(`${row.enrollment_number}: ${err.message}`);
        }
      }
    }

    setResult(res);
    setLoading(false);
  };

  const downloadTemplate = () => {
    const template = importType === 'students' ? STUDENT_TEMPLATE : FEE_TEMPLATE;
    Alert.alert('CSV Template', `Copy this template:\n\n${template}`);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScreenHeader title="Bulk Import" showBack />

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {/* Type Toggle */}
        <Card className="mb-4">
          <Text className="text-sm font-semibold text-gray-700 mb-3">Import Type</Text>
          <View className="flex-row gap-2">
            {(['students', 'fees'] as ImportType[]).map(t => (
              <TouchableOpacity
                key={t}
                onPress={() => { setImportType(t); setFileName(null); setFileContent(null); setResult(null); }}
                className={`flex-1 py-3 rounded-xl items-center border-2 ${importType === t ? 'bg-primary-600 border-primary-600' : 'bg-white border-gray-200'}`}
              >
                <Ionicons name={t === 'students' ? 'people' : 'cash'} size={20} color={importType === t ? '#fff' : '#9ca3af'} />
                <Text className={`text-sm font-semibold mt-1 capitalize ${importType === t ? 'text-white' : 'text-gray-500'}`}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Template Download */}
        <Card className="mb-4">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="font-semibold text-gray-900">CSV Template</Text>
              <Text className="text-gray-400 text-xs mt-0.5">Download the required format</Text>
            </View>
            <TouchableOpacity onPress={downloadTemplate} className="flex-row items-center bg-primary-50 px-3 py-2 rounded-lg">
              <Ionicons name="download-outline" size={16} color="#4f46e5" />
              <Text className="text-primary-600 text-sm font-semibold ml-1">Template</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* File Picker */}
        <Card className="mb-4">
          <Text className="font-semibold text-gray-900 mb-3">Select CSV File</Text>
          <TouchableOpacity
            onPress={pickFile}
            className="border-2 border-dashed border-gray-200 rounded-xl p-6 items-center"
          >
            <View className="w-14 h-14 bg-primary-50 rounded-full items-center justify-center mb-3">
              <Ionicons name="cloud-upload-outline" size={28} color="#4f46e5" />
            </View>
            {fileName ? (
              <>
                <Text className="font-semibold text-gray-900">{fileName}</Text>
                <Text className="text-green-600 text-xs mt-1">File selected ✓</Text>
              </>
            ) : (
              <>
                <Text className="font-semibold text-gray-700">Tap to select CSV file</Text>
                <Text className="text-gray-400 text-xs mt-1">Supports .csv format</Text>
              </>
            )}
          </TouchableOpacity>
        </Card>

        {/* Import Button */}
        {fileContent && (
          <Button
            title={`Import ${importType === 'students' ? 'Students' : 'Fee Payments'}`}
            onPress={handleImport}
            loading={loading}
            icon={<Ionicons name="cloud-upload" size={18} color="#fff" />}
            className="mb-4"
          />
        )}

        {/* Results */}
        {result && (
          <Card>
            <Text className="font-bold text-gray-900 mb-3">Import Results</Text>
            <View className="flex-row gap-2 mb-3">
              <View className="flex-1 bg-green-50 rounded-lg p-3 items-center">
                <Text className="text-2xl font-bold text-green-600">{result.success}</Text>
                <Text className="text-green-600 text-xs">Success</Text>
              </View>
              <View className="flex-1 bg-yellow-50 rounded-lg p-3 items-center">
                <Text className="text-2xl font-bold text-yellow-600">{result.skipped}</Text>
                <Text className="text-yellow-600 text-xs">Skipped</Text>
              </View>
              <View className="flex-1 bg-red-50 rounded-lg p-3 items-center">
                <Text className="text-2xl font-bold text-red-600">{result.failed}</Text>
                <Text className="text-red-600 text-xs">Failed</Text>
              </View>
            </View>

            {result.generated.length > 0 && (
              <View className="mb-3">
                <Text className="text-sm font-semibold text-gray-700 mb-1">Generated Enrollment Numbers:</Text>
                {result.generated.slice(0, 5).map((e, i) => (
                  <Text key={i} className="text-xs text-gray-500">• {e}</Text>
                ))}
                {result.generated.length > 5 && (
                  <Text className="text-xs text-gray-400">...and {result.generated.length - 5} more</Text>
                )}
              </View>
            )}

            {result.errors.length > 0 && (
              <View>
                <Text className="text-sm font-semibold text-red-600 mb-1">Errors:</Text>
                {result.errors.slice(0, 5).map((e, i) => (
                  <Text key={i} className="text-xs text-red-500">• {e}</Text>
                ))}
                {result.errors.length > 5 && (
                  <Text className="text-xs text-gray-400">...and {result.errors.length - 5} more errors</Text>
                )}
              </View>
            )}
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
